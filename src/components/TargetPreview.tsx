"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
  type RefObject,
} from "react";
import * as THREE from "three";

import useScene, { type SceneContext } from "@/hooks/useScene";
import { useSceneContext } from "@/context/SceneProvider";

type TargetPreviewBaseProps = {
  target: THREE.WebGLRenderTarget;
  renderOrder?: number;
  blending?: THREE.Blending;
  transparent?: boolean;
  toneMapped?: boolean;
};

export type TargetPreviewProps = TargetPreviewBaseProps &
  Omit<ComponentProps<"div">, "ref" | "children"> & {
    width?: string | number;
    height?: string | number;
  };

type PreviewAssets = {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  geometry: THREE.PlaneGeometry;
  material: THREE.MeshBasicMaterial;
};

export default function TargetPreview({
  target,
  renderOrder = 0,
  blending = THREE.NoBlending,
  transparent = true,
  toneMapped = false,
  className,
  style,
  width,
  height,
  ...divProps
}: TargetPreviewProps) {
  const assetsRef = useRef<PreviewAssets | null>(null);
  const sharedScene = useSceneContext();
  const sharedReady = sharedScene?.ready ?? true;

  const handleCreate = useCallback(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      map: target.texture,
      toneMapped,
      transparent,
      blending,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = renderOrder;
    scene.add(mesh);

    assetsRef.current = { scene, camera, mesh, geometry, material };

    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      assetsRef.current = null;
    };
  }, [blending, renderOrder, target.texture, toneMapped, transparent]);

  const handleRender = useCallback((context: SceneContext) => {
    const assets = assetsRef.current;
    if (!assets) return;

    const prevTarget = context.renderer.getRenderTarget();
    context.renderer.setRenderTarget(null);
    context.renderer.render(assets.scene, assets.camera);
    context.renderer.setRenderTarget(prevTarget);
  }, []);

  const sharedContextRef = sharedScene?.contextRef;
  const shouldCreateOwnScene = !sharedContextRef;

  // Use external/shared context if provided, otherwise create own scene
  const ownScene = useScene({
    onCreate: shouldCreateOwnScene ? handleCreate : undefined,
    onRender: shouldCreateOwnScene ? handleRender : undefined,
  });

  const containerRef = shouldCreateOwnScene
    ? ownScene.containerRef
    : useRef<HTMLDivElement>(null);

  // If using external context, set up assets and register render callback
  useEffect(() => {
    if (!sharedContextRef || !sharedReady) return;

    // Create assets
    const cleanup = handleCreate();

    return cleanup;
  }, [sharedContextRef, handleCreate, sharedReady]);

  // Manual render when using external context
  useEffect(() => {
    if (!sharedContextRef?.current || !sharedReady) return;

    const context = sharedContextRef.current;
    const register = context.registerRenderCallback;
    if (!register) {
      handleRender(context);
      return;
    }

    const unregister = register((ctx) => {
      handleRender(ctx);
    }, renderOrder);

    return () => {
      unregister?.();
    };
  }, [sharedContextRef, handleRender, renderOrder, sharedReady]);

  useEffect(() => {
    const assets = assetsRef.current;
    if (!assets) return;
    assets.material.map = target.texture;
    assets.material.needsUpdate = true;
  }, [target.texture]);

  useEffect(() => {
    const assets = assetsRef.current;
    if (!assets) return;
    assets.material.blending = blending;
    assets.material.transparent = transparent;
    assets.material.toneMapped = toneMapped;
    assets.material.needsUpdate = true;
  }, [blending, transparent, toneMapped]);

  if (!shouldCreateOwnScene) {
    return null;
  }

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
