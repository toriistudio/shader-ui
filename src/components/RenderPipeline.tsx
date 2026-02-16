"use client";

import { Fragment, useEffect, useMemo } from "react";
import type { ComponentType } from "react";
import * as THREE from "three";

import { useSceneContext } from "@/context/SceneProvider";
import TargetPreview from "@/components/TargetPreview";
import CombineShaderPass from "@/components/CombineShaderPass";
import type {
  CombineMode,
  CombineShaderPassProps,
} from "@/components/CombineShaderPass";

type RenderPassSpec = {
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  enabled?: boolean;
};

type CombineOptions = Partial<
  Omit<CombineShaderPassProps, "inputA" | "inputB" | "target">
> & { mode?: CombineMode };

type RenderPipelineProps = {
  passes: RenderPassSpec[];
  combine?: CombineOptions;
  preview?: boolean;
  previewProps?: Partial<React.ComponentProps<typeof TargetPreview>>;
};

type TargetEntry = {
  key: string;
  target: THREE.WebGLRenderTarget;
};

const DEFAULT_TARGET_OPTIONS: THREE.RenderTargetOptions = {
  depthBuffer: false,
  stencilBuffer: false,
};

export default function RenderPipeline({
  passes,
  combine,
  preview = true,
  previewProps,
}: RenderPipelineProps) {
  const sharedScene = useSceneContext();
  const size = sharedScene?.size ?? { width: 1, height: 1 };

  const targets = useMemo(() => {
    const entries: TargetEntry[] = passes.map((_, index) => ({
      key: `pass_${index}`,
      target: new THREE.WebGLRenderTarget(1, 1, DEFAULT_TARGET_OPTIONS),
    }));

    entries.push({
      key: "combine",
      target: new THREE.WebGLRenderTarget(1, 1, DEFAULT_TARGET_OPTIONS),
    });

    return entries;
  }, [passes]);

  useEffect(() => {
    if (size.width <= 1 || size.height <= 1) return;
    targets.forEach(({ target }) => {
      target.setSize(size.width, size.height);
    });
  }, [size.height, size.width, targets]);

  useEffect(() => {
    return () => {
      targets.forEach(({ target }) => {
        target.dispose();
      });
    };
  }, [targets]);

  if (passes.length < 2) {
    throw new Error("RenderPipeline requires at least 2 passes.");
  }

  const passTargets = targets.filter((entry) => entry.key.startsWith("pass_"));
  const combineTarget = targets.find(
    (entry) => entry.key === "combine",
  )?.target;

  const firstEnabledIndex = passes.findIndex((pass) => pass.enabled !== false);
  const secondEnabledIndex = passes.findIndex(
    (pass, index) => index > firstEnabledIndex && pass.enabled !== false,
  );

  const passOutputTarget = (index: number) =>
    passTargets[index]?.target ?? null;

  const getOutputTarget = () => {
    if (!passes.length) return null;

    const lastEnabledIndex = [...passes]
      .map((pass, index) => ({ pass, index }))
      .filter(({ pass }) => pass.enabled !== false)
      .map(({ index }) => index)
      .pop();

    if (lastEnabledIndex === undefined) return null;

    if (lastEnabledIndex <= Math.max(firstEnabledIndex, secondEnabledIndex)) {
      return combineTarget ?? null;
    }

    return passOutputTarget(lastEnabledIndex);
  };

  let previousOutput: THREE.WebGLRenderTarget | null = null;
  let combineRendered = false;

  const renderedPasses = passes.map((pass, index) => {
    if (pass.enabled === false) return null;

    const Component = pass.component;
    const target = passOutputTarget(index);
    const inputTexture = previousOutput?.texture ?? null;

    const element = (
      <Component
        key={`pass_${index}`}
        target={target}
        inputTexture={inputTexture}
        {...(pass.props ?? {})}
      />
    );

    if (!combineRendered && combineTarget && index === secondEnabledIndex) {
      const inputA =
        passOutputTarget(firstEnabledIndex)?.texture ?? inputTexture;
      const inputB =
        passOutputTarget(secondEnabledIndex)?.texture ?? inputTexture;

      combineRendered = true;
      previousOutput = combineTarget;

      return (
        <Fragment key={`combine_${index}`}>
          {element}
          <CombineShaderPass
            {...combine}
            inputA={inputA}
            inputB={inputB}
            target={combineTarget}
          />
        </Fragment>
      );
    }

    previousOutput = target;
    return element;
  });

  const outputTarget = getOutputTarget();

  return (
    <>
      {renderedPasses}
      {preview && outputTarget && (
        <TargetPreview
          target={outputTarget}
          blending={THREE.NormalBlending}
          renderOrder={0}
          {...previewProps}
        />
      )}
    </>
  );
}
