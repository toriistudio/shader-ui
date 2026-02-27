"use client";

import { useEffect } from "react";
import * as THREE from "three";

import { useSceneContext } from "@/context/SceneProvider";

export default function DitherStreamRendererConfig() {
  const sharedScene = useSceneContext();

  useEffect(() => {
    const context = sharedScene?.contextRef.current;
    if (!context) return;

    const renderer = context.renderer;
    const prevOutputColorSpace = renderer.outputColorSpace;
    const prevToneMapping = renderer.toneMapping;

    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    return () => {
      renderer.outputColorSpace = prevOutputColorSpace;
      renderer.toneMapping = prevToneMapping;
    };
  }, [sharedScene]);

  return null;
}
