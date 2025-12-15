"use client";

import { useCallback, useEffect, useRef, type ComponentProps } from "react";
import * as THREE from "three";

import useScene, { type SceneContext } from "@/hooks/useScene";
import fragmentShader from "@/shaders/shader-art/fragment.glsl";
import vertexShader from "@/shaders/shader-art/vertex.glsl";

type ShaderUniforms = {
  uIterations: number;
  uAmplitude: number;
  uFreq: number;
};

type ShaderArtProps = {
  uniforms: ShaderUniforms;
} & Omit<
  ComponentProps<"div">,
  "ref" | "children" | "color" | "width" | "height"
> & {
    width?: string | number;
    height?: string | number;
  };

type ShaderAssets = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  geometry: THREE.PlaneGeometry;
  material: THREE.ShaderMaterial;
};

export default function ShaderArt({
  uniforms,
  className,
  style,
  width,
  height,
  ...divProps
}: ShaderArtProps) {
  const shaderUniformsRef = useRef({
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    uIterations: { value: Math.max(1, uniforms.uIterations) },
    uAmplitude: { value: uniforms.uAmplitude },
    uFreq: { value: uniforms.uFreq },
  });
  const assetsRef = useRef<ShaderAssets | null>(null);

  const handleCreate = useCallback(({ scene }: SceneContext) => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: shaderUniformsRef.current,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    assetsRef.current = { mesh, geometry, material };

    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      assetsRef.current = null;
    };
  }, []);

  const handleRender = useCallback(
    (context: SceneContext, _delta: number, elapsedTime: number) => {
      shaderUniformsRef.current.iTime.value = elapsedTime;
      const { width, height } = context.size;
      shaderUniformsRef.current.iResolution.value.set(width, height, 1);
    },
    []
  );

  const { containerRef } = useScene({
    onCreate: handleCreate,
    onRender: handleRender,
  });

  useEffect(() => {
    shaderUniformsRef.current.uIterations.value = Math.max(
      1,
      uniforms.uIterations
    );
    shaderUniformsRef.current.uAmplitude.value = uniforms.uAmplitude;
    shaderUniformsRef.current.uFreq.value = uniforms.uFreq;
  }, [uniforms.uAmplitude, uniforms.uFreq, uniforms.uIterations]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        ...style,
      }}
      {...divProps}
    />
  );
}

export type ShaderArtUniforms = ShaderUniforms;
