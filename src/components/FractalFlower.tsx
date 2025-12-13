"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
} from "react";
import * as THREE from "three";

import useScene, { type SceneContext } from "@/hooks/useScene";
import fragmentShader from "@/shaders/fractal-flower/fragment.glsl";
import vertexShader from "@/shaders/fractal-flower/vertex.glsl";

type FractalFlowerProps = {
  timeScale: number;
  petalRadius: number;
  scale: number;
  intensity: number;
  morphCycle: number;
  color: string;
} & Omit<
  ComponentProps<"div">,
  "ref" | "children" | "color" | "width" | "height"
> & {
  width?: string | number;
  height?: string | number;
};

const BASE_POINT_COUNT = 20000;
const ROTATIONS = [
  0,
  Math.PI / 3,
  (2 * Math.PI) / 3,
  Math.PI,
  (4 * Math.PI) / 3,
  (5 * Math.PI) / 3,
];
const ROTATION_COUNT = ROTATIONS.length;
const TOTAL_POINTS = ROTATION_COUNT * BASE_POINT_COUNT;
const BASE_SPREAD = 200;
const MORPH_SPEED = 0.6;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type FractalUniforms = {
  uTime: { value: number };
  uResolution: { value: THREE.Vector2 };
  uTimeScale: { value: number };
  uPetalRadius: { value: number };
  uIntensity: { value: number };
  uExposure: { value: number };
  uSpread: { value: number };
  uPointSize: { value: number };
  uColor: { value: THREE.Color };
  uMorph: { value: number };
};

type FractalAssets = {
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  uniforms: FractalUniforms;
};

export default function FractalFlower({
  timeScale,
  petalRadius,
  scale,
  intensity,
  morphCycle,
  color,
  className,
  style,
  width,
  height,
  ...divProps
}: FractalFlowerProps) {
  const attributes = useMemo(() => {
    const positions = new Float32Array(TOTAL_POINTS * 3);
    const kValues = new Float32Array(TOTAL_POINTS);
    const eValues = new Float32Array(TOTAL_POINTS);
    const rotations = new Float32Array(TOTAL_POINTS);

    for (let copy = 0; copy < ROTATION_COUNT; copy++) {
      const angle = ROTATIONS[copy];
      for (let i = 0; i < BASE_POINT_COUNT; i++) {
        const index = copy * BASE_POINT_COUNT + i;
        const k = (i % 25) - 12;
        const e = i / 800;

        positions[index * 3] = 0;
        positions[index * 3 + 1] = 0;
        positions[index * 3 + 2] = 0;

        kValues[index] = k;
        eValues[index] = e;
        rotations[index] = angle;
      }
    }

    return {
      positions,
      kValues,
      eValues,
      rotations,
    };
  }, []);

  const uniformsRef = useRef<FractalUniforms>({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTimeScale: { value: 0.78539816339 },
    uPetalRadius: { value: 0.02 },
    uIntensity: { value: 0.25 },
    uExposure: { value: 5 },
    uSpread: { value: BASE_SPREAD / Math.max(scale, 0.0001) },
    uPointSize: { value: 2.5 },
    uColor: { value: new THREE.Color(color) },
    uMorph: { value: 0 },
  });
  const morphRef = useRef({
    progress: uniformsRef.current.uMorph.value,
    target: 0,
    cycle: morphCycle,
  });
  const assetsRef = useRef<FractalAssets | null>(null);

  const handleCreate = useCallback(
    ({ scene }: SceneContext) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(attributes.positions, 3)
      );
      geometry.setAttribute(
        "aK",
        new THREE.BufferAttribute(attributes.kValues, 1)
      );
      geometry.setAttribute(
        "aE",
        new THREE.BufferAttribute(attributes.eValues, 1)
      );
      geometry.setAttribute(
        "aRotation",
        new THREE.BufferAttribute(attributes.rotations, 1)
      );

      const uniformValues = uniformsRef.current;
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: uniformValues,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      });

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);

      assetsRef.current = { points, geometry, material, uniforms: uniformValues };

      return () => {
        scene.remove(points);
        geometry.dispose();
        material.dispose();
        assetsRef.current = null;
      };
    },
    [attributes.eValues, attributes.kValues, attributes.positions, attributes.rotations]
  );

  const handleRender = useCallback(
    (context: SceneContext) => {
      const assets = assetsRef.current;
      if (!assets) return;

      const uniforms = assets.uniforms;
      uniforms.uTime.value = context.clock.getElapsedTime();

      const canvas = context.renderer.domElement;
      uniforms.uResolution.value.set(canvas.width, canvas.height);

      const basePointSize = Math.max(
        2,
        (canvas.height / 400) * (uniforms.uPetalRadius.value * 32)
      );
      const pointSize = Math.min(basePointSize, 6);
      uniforms.uPointSize.value = pointSize;

      const morph = morphRef.current;
      if (Math.abs(morph.target - morph.progress) > 0.001) {
        const delta = context.clock.getDelta();
        const direction = Math.sign(morph.target - morph.progress);
        morph.progress = clamp(
          morph.progress + direction * delta * MORPH_SPEED,
          0,
          1
        );
      }
      uniforms.uMorph.value = morph.progress;
    },
    []
  );

  const { containerRef } = useScene({
    onCreate: handleCreate,
    onRender: handleRender,
  });

  useEffect(() => {
    const uniforms = uniformsRef.current;
    uniforms.uTimeScale.value = timeScale;
    uniforms.uPetalRadius.value = petalRadius;
    uniforms.uSpread.value = BASE_SPREAD / Math.max(scale, 0.0001);
    uniforms.uIntensity.value = intensity;
    uniforms.uColor.value.set(color);
    uniforms.uMorph.value = morphRef.current.progress;
  }, [color, intensity, petalRadius, scale, timeScale]);

  useEffect(() => {
    if (morphRef.current.cycle === morphCycle) {
      return;
    }

    morphRef.current.cycle = morphCycle;
    morphRef.current.target = morphRef.current.target < 0.5 ? 1 : 0;
  }, [morphCycle]);

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
