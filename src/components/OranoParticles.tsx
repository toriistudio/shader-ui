"use client";

import { useCallback, useEffect, useRef, type ComponentProps } from "react";
import * as THREE from "three";

import useScene from "@/hooks/useScene";
import type { SceneContext } from "@/hooks/useScene";
import fragmentShader from "@/shaders/orano-particles/fragment.glsl";
import vertexShader from "@/shaders/orano-particles/vertex.glsl";

export type OranoParticlesUniforms = {
  color: string;
  alpha: number;
  wind: number;
  baseSize: number;
  distanceOffset: number;
  distanceStrength: number;
  particleCount: number;
};

type OranoParticlesProps = OranoParticlesUniforms &
  Omit<
    ComponentProps<"div">,
    keyof OranoParticlesUniforms | "ref" | "width" | "height"
  > & {
    width?: string | number;
    height?: string | number;
  };

const X_RANGE = 20;
const Y_RANGE = { min: -8, max: 2 };
const Z_RANGE = { min: -5, max: 215 };

type UniformValues = {
  uColor: { value: THREE.Color };
  uAlpha: { value: number };
  uTime: { value: number };
  uWind: { value: number };
  uBaseSize: { value: number };
  uDistanceOffset: { value: number };
  uDistanceStrength: { value: number };
};

function createParticleGeometry(count: number) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const x = (Math.random() - 0.5) * X_RANGE;
    const y = Math.random() * (Y_RANGE.max - Y_RANGE.min) + Y_RANGE.min;
    const z = Math.random() * (Z_RANGE.max - Z_RANGE.min) + Z_RANGE.min;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();

  return geometry;
}

function buildUniforms({
  color,
  alpha,
  wind,
  baseSize,
  distanceOffset,
  distanceStrength,
}: OranoParticlesUniforms): UniformValues {
  return {
    uColor: { value: new THREE.Color(color) },
    uAlpha: { value: alpha },
    uTime: { value: 0 },
    uWind: { value: wind },
    uBaseSize: { value: baseSize },
    uDistanceOffset: { value: distanceOffset },
    uDistanceStrength: { value: distanceStrength },
  };
}

type ParticlesAssets = {
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  uniforms: UniformValues;
};

export default function OranoParticles({
  className,
  style,
  width,
  height,
  color,
  alpha,
  wind,
  baseSize,
  distanceOffset,
  distanceStrength,
  particleCount,
  ...divProps
}: OranoParticlesProps) {
  const particlesRef = useRef<ParticlesAssets | null>(null);
  const initialUniformsRef = useRef<OranoParticlesUniforms>({
    color,
    alpha,
    wind,
    baseSize,
    distanceOffset,
    distanceStrength,
    particleCount,
  });
  initialUniformsRef.current = {
    color,
    alpha,
    wind,
    baseSize,
    distanceOffset,
    distanceStrength,
    particleCount,
  };

  const handleCreate = useCallback(({ scene }: SceneContext) => {
    const uniforms = buildUniforms(initialUniformsRef.current);
    const geometry = createParticleGeometry(
      Math.max(1, Math.floor(initialUniformsRef.current.particleCount))
    );
    const material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    particlesRef.current = { points, geometry, material, uniforms };

    return () => {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      particlesRef.current = null;
    };
  }, []);

  const handleRender = useCallback((context: SceneContext) => {
    const assets = particlesRef.current;
    if (!assets) return;

    assets.uniforms.uTime.value = context.clock.getElapsedTime();
  }, []);

  const { containerRef } = useScene({
    onCreate: handleCreate,
    onRender: handleRender,
  });

  // Uniform updates
  useEffect(() => {
    const assets = particlesRef.current;
    if (!assets) return;
    assets.uniforms.uColor.value.set(color);
  }, [color]);

  useEffect(() => {
    const assets = particlesRef.current;
    if (!assets) return;
    assets.uniforms.uAlpha.value = alpha;
  }, [alpha]);

  useEffect(() => {
    const assets = particlesRef.current;
    if (!assets) return;
    assets.uniforms.uWind.value = wind;
  }, [wind]);

  useEffect(() => {
    const assets = particlesRef.current;
    if (!assets) return;
    assets.uniforms.uBaseSize.value = baseSize;
  }, [baseSize]);

  useEffect(() => {
    const assets = particlesRef.current;
    if (!assets) return;
    assets.uniforms.uDistanceOffset.value = distanceOffset;
  }, [distanceOffset]);

  useEffect(() => {
    const assets = particlesRef.current;
    if (!assets) return;
    assets.uniforms.uDistanceStrength.value = distanceStrength;
  }, [distanceStrength]);

  // Particle count changes require new geometry
  useEffect(() => {
    const assets = particlesRef.current;
    if (!assets) return;

    const geometry = createParticleGeometry(
      Math.max(1, Math.floor(particleCount))
    );

    assets.points.geometry.dispose();
    assets.points.geometry = geometry;
    assets.geometry = geometry;
  }, [particleCount]);

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
