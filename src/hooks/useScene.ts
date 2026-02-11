"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";
import * as THREE from "three";

export type SceneContext = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  clock: THREE.Clock;
  size: { width: number; height: number };
  registerRenderCallback?: (
    callback: (
      context: SceneContext,
      deltaTime: number,
      elapsedTime: number
    ) => void,
    priority?: number
  ) => () => void;
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
  manualRender?: boolean;
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
  manualRender = false,
}: UseSceneOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<SceneContext | null>(null);
  const onCreateRef = useRef(onCreate);
  const onRenderRef = useRef(onRender);
  const onResizeRef = useRef(onResize);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const renderCallbacksRef = useRef<
    Array<{
      id: number;
      priority: number;
      callback: (
        context: SceneContext,
        deltaTime: number,
        elapsedTime: number
      ) => void;
    }>
  >([]);
  const nextRenderCallbackId = useRef(0);

  useEffect(() => {
    onCreateRef.current = onCreate;
  }, [onCreate]);

  useEffect(() => {
    onRenderRef.current = onRender;
  }, [onRender]);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  const getFallbackSize = () => {
    if (typeof window === "undefined") {
      return { width: 1, height: 1 };
    }

    const canvas = window.document?.querySelector("canvas");
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      return {
        width: rect.width || canvas.clientWidth || window.innerWidth || 1,
        height: rect.height || canvas.clientHeight || window.innerHeight || 1,
      };
    }

    return { width: window.innerWidth || 1, height: window.innerHeight || 1 };
  };

  // Measure container size synchronously before first paint
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      const initialSize = getFallbackSize();
      sizeRef.current = initialSize;
      setSize(initialSize);
      return;
    }

    const initialWidth = container.clientWidth || 1;
    const initialHeight = container.clientHeight || 1;
    const initialSize = { width: initialWidth, height: initialHeight };
    sizeRef.current = initialSize;
    setSize(initialSize);
  }, []);

  const effectDeps = deps ?? EMPTY_DEPS;

  useEffect(() => {
    if (containerRef.current) return;
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (containerRef.current) return;
      const nextSize = getFallbackSize();
      sizeRef.current = nextSize;
      setSize(nextSize);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
    const initialSize = { width: initialWidth, height: initialHeight };
    sizeRef.current = initialSize;
    setSize(initialSize);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      ...rendererOptions,
    });
    renderer.autoClear = false;
    renderer.autoClearColor = true;
    renderer.autoClearDepth = true;
    renderer.autoClearStencil = true;
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

    const registerRenderCallback = (
      callback: (
        context: SceneContext,
        deltaTime: number,
        elapsedTime: number
      ) => void,
      priority = 0
    ) => {
      const id = nextRenderCallbackId.current++;
      const entry = { id, priority, callback };
      renderCallbacksRef.current = [...renderCallbacksRef.current, entry].sort(
        (a, b) => (a.priority - b.priority) || (a.id - b.id)
      );

      return () => {
        renderCallbacksRef.current = renderCallbacksRef.current.filter(
          (item) => item.id !== id
        );
      };
    };

    const context: SceneContext = {
      renderer,
      scene,
      camera,
      clock,
      size: { ...sizeRef.current },
      registerRenderCallback,
    };
    contextRef.current = context;
    setReady(true);

    const teardownCreate = onCreateRef.current?.(context);

    let elapsedTime = 0;
    let animationFrameId = 0;
    const renderLoop = () => {
      const delta = clock.getDelta();
      elapsedTime += delta;
      context.size = { ...sizeRef.current };
      onRenderRef.current?.(context, delta, elapsedTime);
      renderCallbacksRef.current.forEach((entry) => {
        entry.callback(context, delta, elapsedTime);
      });
      if (!manualRender) {
        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    animationFrameId = requestAnimationFrame(renderLoop);

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      const newSize = { width, height };
      sizeRef.current = newSize;
      setSize(newSize);

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
      } else if (camera instanceof THREE.OrthographicCamera) {
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();
      }
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
      setReady(false);
    };
  }, effectDeps);

  return { containerRef, contextRef, size, ready };
}
