"use client";

import { useEffect, useRef, type DependencyList } from "react";
import * as THREE from "three";

export type SceneContext = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  clock: THREE.Clock;
  size: { width: number; height: number };
};

type UseSceneOptions = {
  renderer?: THREE.WebGLRendererParameters;
  camera?: {
    type?: "perspective" | "orthographic";
    fov?: number;
    near?: number;
    far?: number;
    position?: [number, number, number];
  };
  pixelRatio?: number;
  onCreate?: (context: SceneContext) => void | (() => void);
  onRender?: (
    context: SceneContext,
    deltaTime: number,
    elapsedTime: number
  ) => void;
  onResize?: (
    context: SceneContext,
    size: { width: number; height: number }
  ) => void;
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
  const sizeRef = useRef({ width: 0, height: 0 });

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
      (typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio, 2)
        : 1);

    const initialWidth = container.clientWidth || 1;
    const initialHeight = container.clientHeight || 1;
    sizeRef.current = { width: initialWidth, height: initialHeight };

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      ...rendererOptions,
    });
    renderer.setPixelRatio(resolvedPixelRatio);
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    let camera: THREE.Camera;

    if (cameraOptions?.type === "orthographic") {
      const halfWidth = initialWidth / 2;
      const halfHeight = initialHeight / 2;
      const orthoCamera = new THREE.OrthographicCamera(
        -halfWidth,
        halfWidth,
        halfHeight,
        -halfHeight,
        cameraOptions?.near ?? 0.1,
        cameraOptions?.far ?? 1000
      );
      const [, , z = 10] = cameraOptions?.position ?? [];
      orthoCamera.position.set(0, 0, z);
      camera = orthoCamera;
    } else {
      const perspectiveCamera = new THREE.PerspectiveCamera(
        cameraOptions?.fov ?? 55,
        initialWidth / Math.max(1, initialHeight),
        cameraOptions?.near ?? 0.1,
        cameraOptions?.far ?? 500
      );
      const [x = 0, y = 0, z = 15] = cameraOptions?.position ?? [];
      perspectiveCamera.position.set(x, y, z);
      camera = perspectiveCamera;
    }

    const clock = new THREE.Clock();
    const context: SceneContext = {
      renderer,
      scene,
      camera,
      clock,
      size: { ...sizeRef.current },
    };
    contextRef.current = context;

    const teardownCreate = onCreateRef.current?.(context);

    let elapsedTime = 0;
    let animationFrameId = 0;
    const renderLoop = () => {
      const delta = clock.getDelta();
      elapsedTime += delta;
      context.size = { ...sizeRef.current };
      onRenderRef.current?.(context, delta, elapsedTime);
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    animationFrameId = requestAnimationFrame(renderLoop);

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      sizeRef.current = { width, height };

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / Math.max(1, height);
      } else if (camera instanceof THREE.OrthographicCamera) {
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
      }
      camera.updateProjectionMatrix();
      context.size = { ...sizeRef.current };
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
