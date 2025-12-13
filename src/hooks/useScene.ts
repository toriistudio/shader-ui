"use client";

import { useEffect, useRef, type DependencyList } from "react";
import * as THREE from "three";

export type SceneContext = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;
};

type UseSceneOptions = {
  renderer?: THREE.WebGLRendererParameters;
  camera?: {
    fov?: number;
    near?: number;
    far?: number;
    position?: [number, number, number];
  };
  pixelRatio?: number;
  onCreate?: (context: SceneContext) => void | (() => void);
  onRender?: (context: SceneContext) => void;
  onResize?: (context: SceneContext, size: { width: number; height: number }) => void;
  deps?: DependencyList;
};

const EMPTY_DEPS: [] = [];

export default function useScene({
  renderer: rendererOptions,
  camera: cameraOptions,
  pixelRatio,
  onCreate,
  onRender,
  onResize,
  deps,
}: UseSceneOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<SceneContext | null>(null);
  const onCreateRef = useRef(onCreate);
  const onRenderRef = useRef(onRender);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onCreateRef.current = onCreate;
  }, [onCreate]);

  useEffect(() => {
    onRenderRef.current = onRender;
  }, [onRender]);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  const effectDeps = deps ?? EMPTY_DEPS;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resolvedPixelRatio =
      pixelRatio ??
      (typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      ...rendererOptions,
    });
    renderer.setPixelRatio(resolvedPixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      cameraOptions?.fov ?? 55,
      container.clientWidth / Math.max(1, container.clientHeight),
      cameraOptions?.near ?? 0.1,
      cameraOptions?.far ?? 500
    );
    const [x = 0, y = 0, z = 15] = cameraOptions?.position ?? [];
    camera.position.set(x, y, z);

    const clock = new THREE.Clock();
    const context: SceneContext = { renderer, scene, camera, clock };
    contextRef.current = context;

    const teardownCreate = onCreateRef.current?.(context);

    let animationFrameId = 0;
    const renderLoop = () => {
      onRenderRef.current?.(context);
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    animationFrameId = requestAnimationFrame(renderLoop);

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      onResizeRef.current?.(context, { width, height });
    });
    resizeObserver.observe(container);

    return () => {
      teardownCreate?.();
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      contextRef.current = null;
    };
  }, effectDeps);

  return { containerRef, contextRef };
}
