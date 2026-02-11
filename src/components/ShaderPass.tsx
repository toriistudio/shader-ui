"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type RefObject,
} from "react";
import * as THREE from "three";

import useScene, { type SceneContext } from "@/hooks/useScene";
import { useSceneContext } from "@/hooks/SceneProvider";

type ShaderPassBaseProps = {
  /** GLSL vertex shader */
  vertexShader: string;
  /** GLSL fragment shader */
  fragmentShader: string;

  /** Shader uniforms object */
  uniforms: Record<string, THREE.IUniform>;

  /** Name of the sampler2D uniform that receives inputTexture (default: "uTexture") */
  inputUniform?: string;

  /** Texture that this pass samples from (optional) */
  inputTexture?: THREE.Texture | null;

  /** Render target to write into. If omitted, renders to screen (canvas) */
  target?: THREE.WebGLRenderTarget | null;

  /** Whether to clear the target before rendering this pass */
  clear?: boolean;

  /** Clear color (only used when clear=true) */
  clearColor?: THREE.ColorRepresentation;

  /** Override blending if you want additive / difference passes later */
  blending?: THREE.Blending;
  transparent?: boolean;

  /** Disable pass rendering without unmounting */
  enabled?: boolean;

  /** Optional: update a time uniform each frame */
  timeUniform?: string;

  /** Optional: update a resolution uniform each frame */
  resolutionUniform?: string;

  /** Optional: palette hex colors averaged into uPaletteColor/uHasPalette uniforms */
  hexColors?: string[];

  /** Render priority in the frame loop (lower runs earlier) */
  priority?: number;

};

export type ShaderPassProps = ShaderPassBaseProps &
  Omit<ComponentProps<"div">, "ref" | "children" | "width" | "height"> & {
    width?: string | number;
    height?: string | number;
  };

type PassAssets = {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
};

const buildQuadGeometry = () => {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array([
    -1, -1, 0, 1, -1, 0, 1, 1, 0,

    -1, -1, 0, 1, 1, 0, -1, 1, 0,
  ]);
  const uvs = new Float32Array([
    0, 0, 1, 0, 1, 1,

    0, 0, 1, 1, 0, 1,
  ]);
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return geom;
};

export default function ShaderPass({
  vertexShader,
  fragmentShader,
  uniforms,
  inputUniform = "uTexture",
  inputTexture = null,
  target = null,
  clear = true,
  clearColor = 0x000000,
  blending = THREE.NoBlending,
  transparent = false,
  enabled = true,
  timeUniform,
  resolutionUniform,
  hexColors,
  priority = 0,
  className,
  style,
  width,
  height,
  ...divProps
}: ShaderPassProps) {
  const assetsRef = useRef<PassAssets | null>(null);
  const sharedScene = useSceneContext();
  const sharedReady = sharedScene?.ready ?? true;
  const mixedPaletteColor = useMemo(() => {
    if (!hexColors?.length) return null;
    const mixed = new THREE.Color(0, 0, 0);
    hexColors.forEach((hex) => {
      const c = new THREE.Color(hex);
      mixed.r += c.r;
      mixed.g += c.g;
      mixed.b += c.b;
    });
    mixed.r /= hexColors.length;
    mixed.g /= hexColors.length;
    mixed.b /= hexColors.length;
    return mixed;
  }, [hexColors]);

  useEffect(() => {
    if (!uniforms.uPaletteColor) {
      uniforms.uPaletteColor = {
        value: mixedPaletteColor ?? new THREE.Color(0, 0, 0),
      };
    } else {
      (uniforms.uPaletteColor.value as THREE.Color).copy(
        mixedPaletteColor ?? new THREE.Color(0, 0, 0)
      );
    }

    if (!uniforms.uHasPalette) {
      uniforms.uHasPalette = { value: mixedPaletteColor ? 1 : 0 };
    } else {
      uniforms.uHasPalette.value = mixedPaletteColor ? 1 : 0;
    }

    if (assetsRef.current) {
      assetsRef.current.material.uniformsNeedUpdate = true;
    }
  }, [mixedPaletteColor, uniforms]);

  const handleCreate = useCallback(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const geometry = buildQuadGeometry();
    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      uniforms,
      blending,
      transparent,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    assetsRef.current = { scene, camera, mesh, geometry, material };

    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      assetsRef.current = null;
    };
  }, [blending, fragmentShader, transparent, uniforms, vertexShader]);

  const handleRender = useCallback(
    (context: SceneContext, delta: number) => {
      if (!enabled) return;
      const assets = assetsRef.current;
      if (!assets) return;

      if (timeUniform && uniforms[timeUniform]) {
        uniforms[timeUniform].value = (uniforms[timeUniform].value ?? 0) + delta;
      }

      if (resolutionUniform && uniforms[resolutionUniform]) {
        const v = uniforms[resolutionUniform].value as THREE.Vector2;
        if (v?.set) v.set(context.size.width, context.size.height);
      }

      const prevTarget = context.renderer.getRenderTarget();
      const prevAutoClear = context.renderer.autoClear;

      context.renderer.autoClear = false;
      if (target) context.renderer.setRenderTarget(target);
      else context.renderer.setRenderTarget(null);

      if (clear) {
        const prevClear = context.renderer.getClearColor(new THREE.Color());
        const prevAlpha = context.renderer.getClearAlpha();

        context.renderer.setClearColor(new THREE.Color(clearColor), 1);
        context.renderer.clear(true, true, true);
        context.renderer.setClearColor(prevClear, prevAlpha);
      }

      context.renderer.render(assets.scene, assets.camera);
      context.renderer.setRenderTarget(prevTarget);
      context.renderer.autoClear = prevAutoClear;
    },
    [clear, clearColor, enabled, resolutionUniform, target, timeUniform, uniforms]
  );

  const sharedContextRef = sharedScene?.contextRef;
  const shouldCreateOwnScene = !sharedContextRef;

  // Use external/shared context if provided, otherwise create own scene
  const ownScene = useScene({
    onCreate: shouldCreateOwnScene ? handleCreate : undefined,
    onRender: shouldCreateOwnScene ? handleRender : undefined,
    manualRender: true,
  });

  const containerRef = shouldCreateOwnScene
    ? ownScene.containerRef
    : useRef<HTMLDivElement>(null);

  // If using external context, set up assets and register render callback
  useEffect(() => {
    if (!sharedContextRef || !sharedReady) return;

    // Create assets
    const cleanup = handleCreate();

    // Register render callback with external context
    // Note: This is a simplified approach - in production you'd want a proper
    // callback registration system

    return cleanup;
  }, [sharedContextRef, handleCreate, sharedReady]);

  // Manual render when using external context
  useEffect(() => {
    if (!sharedContextRef?.current || !enabled || !sharedReady) return;

    const context = sharedContextRef.current;
    const register = context.registerRenderCallback;
    if (!register) {
      let lastTime = performance.now();
      const renderOnce = () => {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        handleRender(context, delta);
      };
      renderOnce();
      return;
    }

    const unregister = register(
      (ctx, delta, elapsed) => {
        void elapsed;
        handleRender(ctx, delta);
      },
      priority
    );

    return () => {
      unregister?.();
    };
  }, [sharedContextRef, enabled, handleRender, priority, sharedReady]);

  useEffect(() => {
    if (!inputTexture) return;
    const u = uniforms?.[inputUniform];
    if (u) u.value = inputTexture;
  }, [inputTexture, inputUniform, uniforms]);

  useEffect(() => {
    const assets = assetsRef.current;
    if (!assets) return;
    assets.material.vertexShader = vertexShader;
    assets.material.fragmentShader = fragmentShader;
    assets.material.uniforms = uniforms;
    assets.material.needsUpdate = true;
  }, [fragmentShader, uniforms, vertexShader]);

  useEffect(() => {
    const assets = assetsRef.current;
    if (!assets) return;
    assets.material.blending = blending;
    assets.material.transparent = transparent;
    assets.material.needsUpdate = true;
  }, [blending, transparent]);

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
