"use client";

import { gsap } from "gsap";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
} from "react";
import * as THREE from "three";

import useScene, { type SceneContext } from "@/hooks/useScene";
import fragmentShader from "@/shaders/menu-glitch/fragment.glsl";
import vertexShader from "@/shaders/menu-glitch/vertex.glsl";

const GRADIENT_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTVBRkY1OTJDREMyMTFFODhGRjFFRjgxRjM2QjM2MDMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTVBRkY1OTNDREMyMTFFODhGRjFFRjgxRjM2QjM2MDMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpFNUFGRjU5MENEQzIxMUU4OEZGMUVGODFGMzZCMzYwMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpFNUFGRjU5MUNEQzIxMUU4OEZGMUVGODFGMzZCMzYwMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pksi3ywAAADMSURBVHjarFDLDoMwDDMtUDjtME3TtMcn7f9/hngBCoTSTjsMydixnVZqxTcAX51Quwsad1M80PonWvdCUA7+rrii82eEulcG+hoTdwsrQtRB0UZu3KxrN8OPqIBKgRHxI8qaUTD1RuY2p90V+hOjmWix2uSSeGLPKrDdKc5GHzqZLPWY7XEG+F1PLBktpiuzf8ilkMvqcZfLLqf1ltnu7rLh4G88ZPxh4uUOmjMYO3aPqz8Yve0tGiaDduNr/xn8cWbBY8HLzQd8BBgAgOx+ERYDbIEAAAAASUVORK5CYII=";

export type MenuGlitchUniforms = {
  tileAmplitude: number;
  tileOffset: { x: number; y: number };
  tileFrequency: { x: number; y: number };
  planeScale: number;
  gradientAmplitude: number;
  gradientOffset: number;
  gradientProgress: number;
  blueAmplitude: number;
  blueProgress: number;
  waveAmplitude: number;
  waveProgress: number;
  waveStrength: { x: number; y: number };
  whiteTileChances: number;
  whiteTileFrequency: number;
  whiteTileStrength: number;
  saturation: number;
  duration: number;
  debug: boolean;
  showSignal: number;
  hideSignal: number;
};

type MenuGlitchProps = {
  settings: MenuGlitchUniforms;
  onShowDone?: () => void;
  onHideDone?: () => void;
} & Omit<
  ComponentProps<"div">,
  "ref" | "children" | "color" | "width" | "height"
> & {
    width?: string | number;
    height?: string | number;
  };

const BASE_TRANSITION_PROGRESS = 0.5;
const SHOW_BASE_DURATION = 2.72;
const HIDE_BASE_DURATION = 1.8;
const SHOW_PRIMARY_DURATION = 1.1;
const MIN_GLITCH_DURATION = 0.25;

type ShaderAssets = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  geometry: THREE.PlaneGeometry;
  material: THREE.ShaderMaterial;
};

export default function MenuGlitch({
  settings,
  onShowDone,
  onHideDone,
  className,
  style,
  width,
  height,
  ...divProps
}: MenuGlitchProps) {
  const diffuseTexture = useMemo(() => createDiffuseTexture(), []);
  const gradientTextureRef = useRef<THREE.Texture>(new THREE.Texture());

  const sanitizedValues = useMemo(() => {
    const clamp = THREE.MathUtils.clamp;
    return {
      tileAmplitude: Math.max(0.1, settings.tileAmplitude),
      planeScale: Math.max(0.1, settings.planeScale ?? 1),
      tileOffsetX: settings.tileOffset.x,
      tileOffsetY: settings.tileOffset.y,
      tileFrequencyX: Math.max(0.1, settings.tileFrequency.x),
      tileFrequencyY: Math.max(0.1, settings.tileFrequency.y),
      gradientAmplitude: Math.max(0.05, settings.gradientAmplitude),
      gradientOffset: settings.gradientOffset,
      gradientProgress: settings.gradientProgress ?? 1,
      blueAmplitude: Math.max(0.05, settings.blueAmplitude),
      blueProgress: settings.blueProgress ?? 1,
      waveAmplitude: Math.max(0.05, settings.waveAmplitude),
      waveProgress: settings.waveProgress ?? 0.5,
      waveStrengthX: settings.waveStrength.x,
      waveStrengthY: settings.waveStrength.y,
      whiteTileChances: clamp(settings.whiteTileChances, 0.05, 1),
      whiteTileFrequency: Math.max(0.01, settings.whiteTileFrequency),
      whiteTileStrength: Math.max(0, settings.whiteTileStrength),
      saturation: Math.max(0, settings.saturation),
      duration: Math.max(
        MIN_GLITCH_DURATION,
        settings.duration ?? SHOW_PRIMARY_DURATION
      ),
      debug: settings.debug,
    };
  }, [settings]);

  const sanitizedRef = useRef(sanitizedValues);
  sanitizedRef.current = sanitizedValues;

  const sizeRef = useRef({ width: 0, height: 0 });
  const assetsRef = useRef<ShaderAssets | null>(null);
  const animationVisibleRef = useRef(false);

  const shaderUniforms = useRef({
    tDiffuse: { value: diffuseTexture },
    tGradient: { value: gradientTextureRef.current },
    uTime: { value: 0 },
    uTileProgressVertical: { value: -0.5 },
    uTileProgressHorizontal: { value: -0.5 },
    uTileAmplitude: { value: settings.tileAmplitude },
    uTileOffset: {
      value: new THREE.Vector2(settings.tileOffset.x, settings.tileOffset.y),
    },
    uTileFrequency: {
      value: new THREE.Vector2(
        settings.tileFrequency.x,
        settings.tileFrequency.y
      ),
    },
    uWaveProgress: { value: settings.waveProgress },
    uWaveAmplitude: { value: settings.waveAmplitude },
    uWaveStrength: {
      value: new THREE.Vector2(
        settings.waveStrength.x,
        settings.waveStrength.y
      ),
    },
    uGradientProgress: { value: settings.gradientProgress },
    uGradientOffset: { value: settings.gradientOffset },
    uGradientAmplitude: { value: settings.gradientAmplitude },
    uBlueProgress: { value: settings.blueProgress },
    uBlueAmplitude: { value: settings.blueAmplitude },
    uWhiteTileChances: { value: settings.whiteTileChances },
    uWhiteTileFrequency: { value: settings.whiteTileFrequency },
    uWhiteTileStrength: { value: settings.whiteTileStrength },
    uSaturation: { value: settings.saturation },
  });

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      GRADIENT_DATA_URL,
      (texture) => {
        if (disposed) return;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        gradientTextureRef.current = texture;
        shaderUniforms.current.tGradient.value = texture;
      },
      undefined,
      () => {
        if (disposed) return;
        gradientTextureRef.current = new THREE.Texture();
        shaderUniforms.current.tGradient.value = gradientTextureRef.current;
      }
    );

    return () => {
      disposed = true;
    };
  }, []);

  const updateMeshScale = useCallback(() => {
    const assets = assetsRef.current;
    if (!assets) return;
    const base = Math.max(
      sizeRef.current.width || 1,
      sizeRef.current.height || 1
    );
    const scale = base * sanitizedRef.current.planeScale;
    assets.mesh.scale.set(scale, scale, 1);
  }, []);

  const updateVisibility = useCallback(() => {
    const mesh = assetsRef.current?.mesh;
    if (!mesh) return;
    mesh.visible = sanitizedRef.current.debug || animationVisibleRef.current;
  }, []);

  const handleCreate = useCallback(
    ({ scene, size }: SceneContext) => {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: shaderUniforms.current,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      assetsRef.current = { mesh, geometry, material };
      sizeRef.current = size;
      updateMeshScale();
      updateVisibility();

      return () => {
        scene.remove(mesh);
        geometry.dispose();
        material.dispose();
        assetsRef.current = null;
      };
    },
    [updateMeshScale, updateVisibility]
  );

  const handleRender = useCallback(
    (_context: SceneContext, _delta: number, elapsedTime: number) => {
      shaderUniforms.current.uTime.value = elapsedTime;
    },
    []
  );

  const handleResize = useCallback(
    (_context: SceneContext, size: { width: number; height: number }) => {
      sizeRef.current = size;
      updateMeshScale();
    },
    [updateMeshScale]
  );

  const { containerRef } = useScene({
    camera: { type: "orthographic", position: [0, 0, 10], near: 0.1, far: 100 },
    onCreate: handleCreate,
    onRender: handleRender,
    onResize: handleResize,
  });

  const showTimeline = useRef<gsap.core.Timeline | null>(null);
  const hideTimeline = useRef<gsap.core.Timeline | null>(null);
  const transitionTimeline = useRef<gsap.core.Timeline | null>(null);

  const timelineParams = useMemo(
    () => ({
      tileAmplitude: sanitizedValues.tileAmplitude,
      gradientAmplitude: sanitizedValues.gradientAmplitude,
      gradientOffset: sanitizedValues.gradientOffset,
      tileOffsetX: sanitizedValues.tileOffsetX,
      duration: sanitizedValues.duration,
    }),
    [
      sanitizedValues.duration,
      sanitizedValues.gradientAmplitude,
      sanitizedValues.gradientOffset,
      sanitizedValues.tileAmplitude,
      sanitizedValues.tileOffsetX,
    ]
  );

  const primeShowAnimation = useCallback(() => {
    const uniforms = shaderUniforms.current;
    uniforms.uTileProgressHorizontal.value =
      1 + timelineParams.tileAmplitude * 0.5;
    uniforms.uGradientProgress.value = 1 + timelineParams.gradientOffset;
    uniforms.uBlueProgress.value = 1 + timelineParams.tileOffsetX;
    uniforms.uSaturation.value = 1;
    uniforms.uWhiteTileStrength.value = 0;
  }, [
    timelineParams.gradientOffset,
    timelineParams.tileAmplitude,
    timelineParams.tileOffsetX,
  ]);

  const buildTimelines = useCallback(() => {
    const uniforms = shaderUniforms.current;
    const glitchDuration = sanitizedRef.current.duration;
    const desiredShowTotal =
      glitchDuration * (SHOW_BASE_DURATION / SHOW_PRIMARY_DURATION);
    const desiredHideTotal =
      glitchDuration * (HIDE_BASE_DURATION / SHOW_PRIMARY_DURATION);

    const showScale = desiredShowTotal / SHOW_BASE_DURATION;
    const hideScale = desiredHideTotal / HIDE_BASE_DURATION;
    const showAt = (time: number) =>
      (time / SHOW_BASE_DURATION) * desiredShowTotal;
    const hideAt = (time: number) =>
      (time / HIDE_BASE_DURATION) * desiredHideTotal;

    showTimeline.current?.kill();
    hideTimeline.current?.kill();
    transitionTimeline.current?.kill();

    const showTl = gsap.timeline({ paused: true });
    showTl.add(() => {
      animationVisibleRef.current = true;
      updateVisibility();
    }, 0);
    showTl.fromTo(
      uniforms.uTileProgressHorizontal,
      { value: 1 + timelineParams.tileAmplitude * 0.5 },
      {
        value: -timelineParams.tileAmplitude * 0.5,
        duration: glitchDuration,
        ease: "sine.inOut",
      },
      0
    );
    showTl.fromTo(
      uniforms.uGradientProgress,
      { value: 1 + timelineParams.gradientOffset },
      {
        value:
          -timelineParams.gradientOffset * 0.5 -
          timelineParams.gradientAmplitude,
        duration: 0.6 * showScale,
        ease: "sine.inOut",
      },
      showAt(0.1)
    );
    showTl.fromTo(
      uniforms.uBlueProgress,
      { value: 1 + timelineParams.tileOffsetX },
      {
        value:
          -timelineParams.tileOffsetX * 0.5 - timelineParams.gradientAmplitude,
        duration: 0.6 * showScale,
        ease: "sine.inOut",
      },
      showAt(0.125)
    );
    showTl.fromTo(
      uniforms.uSaturation,
      { value: 1 },
      { value: 1.01, duration: 0.52 * showScale, ease: "sine.inOut" },
      0
    );
    showTl.fromTo(
      uniforms.uSaturation,
      { value: 1 },
      { value: 2.5, duration: 0.1 * showScale, ease: "sine.inOut" },
      showAt(0.32)
    );
    showTl.fromTo(
      uniforms.uSaturation,
      { value: 2.5 },
      { value: 1, duration: 1.8 * showScale, ease: "sine.out" },
      showAt(0.92)
    );
    showTl.fromTo(
      uniforms.uWhiteTileStrength,
      { value: 0 },
      { value: 0.1, duration: 1 * showScale, ease: "sine.inOut" },
      showAt(0.3)
    );

    const hideTl = gsap.timeline({ paused: true });
    hideTl.fromTo(
      uniforms.uWhiteTileStrength,
      { value: 0.1 },
      { value: 0, duration: 1 * hideScale, ease: "sine.inOut" },
      0
    );
    hideTl.fromTo(
      uniforms.uSaturation,
      { value: 1 },
      { value: 1.5, duration: 0.4 * hideScale, ease: "sine.inOut" },
      hideAt(0.4)
    );
    hideTl.fromTo(
      uniforms.uSaturation,
      { value: 1.5 },
      { value: 1, duration: 1 * hideScale, ease: "sine.inOut" },
      hideAt(0.8)
    );
    hideTl.fromTo(
      uniforms.uBlueProgress,
      {
        value:
          -timelineParams.tileOffsetX * 0.5 - timelineParams.gradientAmplitude,
      },
      {
        value: 1 + timelineParams.tileOffsetX,
        duration: 0.6 * hideScale,
        ease: "sine.inOut",
      },
      hideAt(0.2)
    );
    hideTl.fromTo(
      uniforms.uTileProgressHorizontal,
      { value: -timelineParams.tileAmplitude * 0.5 },
      {
        value: 1 + timelineParams.tileAmplitude * 0.5,
        duration: 0.9 * hideScale,
        ease: "sine.inOut",
      },
      hideAt(0.2)
    );
    hideTl.fromTo(
      uniforms.uGradientProgress,
      {
        value:
          -timelineParams.gradientOffset * 0.5 -
          timelineParams.gradientAmplitude,
      },
      {
        value: 1 + timelineParams.gradientOffset,
        duration: 0.6 * hideScale,
        ease: "sine.inOut",
      },
      hideAt(0.225)
    );
    hideTl.add(() => {
      animationVisibleRef.current = false;
      updateVisibility();
      onHideDone?.();
    }, hideAt(HIDE_BASE_DURATION));

    showTl.call(
      () => {
        onShowDone?.();
      },
      undefined,
      showAt(0.65)
    );

    showTimeline.current = showTl;
    hideTimeline.current = hideTl;
  }, [onHideDone, onShowDone, timelineParams, updateVisibility]);

  useEffect(() => {
    const uniforms = shaderUniforms.current;

    uniforms.tDiffuse.value = diffuseTexture;
    if (gradientTextureRef.current) {
      uniforms.tGradient.value = gradientTextureRef.current;
    }

    uniforms.uTileAmplitude.value = sanitizedValues.tileAmplitude;
    uniforms.uTileOffset.value.set(
      sanitizedValues.tileOffsetX,
      sanitizedValues.tileOffsetY
    );
    uniforms.uTileFrequency.value.set(
      sanitizedValues.tileFrequencyX,
      sanitizedValues.tileFrequencyY
    );

    uniforms.uWaveAmplitude.value = sanitizedValues.waveAmplitude;
    uniforms.uWaveProgress.value = sanitizedValues.waveProgress;
    uniforms.uWaveStrength.value.set(
      sanitizedValues.waveStrengthX,
      sanitizedValues.waveStrengthY
    );

    uniforms.uGradientProgress.value = sanitizedValues.gradientProgress;
    uniforms.uGradientOffset.value = sanitizedValues.gradientOffset;
    uniforms.uGradientAmplitude.value = sanitizedValues.gradientAmplitude;

    uniforms.uBlueProgress.value = sanitizedValues.blueProgress;
    uniforms.uBlueAmplitude.value = sanitizedValues.blueAmplitude;

    uniforms.uWhiteTileChances.value = sanitizedValues.whiteTileChances;
    uniforms.uWhiteTileFrequency.value = sanitizedValues.whiteTileFrequency;
    uniforms.uWhiteTileStrength.value = sanitizedValues.whiteTileStrength;

    uniforms.uSaturation.value = sanitizedValues.saturation;
    uniforms.uTileProgressVertical.value = BASE_TRANSITION_PROGRESS;

    updateMeshScale();
    updateVisibility();
  }, [diffuseTexture, sanitizedValues, updateMeshScale, updateVisibility]);

  useEffect(() => {
    buildTimelines();

    return () => {
      showTimeline.current?.kill();
      hideTimeline.current?.kill();
      transitionTimeline.current?.kill();
    };
  }, [buildTimelines]);

  useEffect(() => {
    const mesh = assetsRef.current?.mesh;
    if (mesh) {
      mesh.visible = sanitizedValues.debug || animationVisibleRef.current;
    }
  }, [sanitizedValues.debug]);

  const lastShowSignal = useRef(settings.showSignal);
  useEffect(() => {
    if (settings.showSignal === lastShowSignal.current) {
      return;
    }
    lastShowSignal.current = settings.showSignal;
    hideTimeline.current?.pause(0);
    primeShowAnimation();
    showTimeline.current?.seek(0).play();
  }, [primeShowAnimation, settings.showSignal]);

  const lastHideSignal = useRef(settings.hideSignal);
  useEffect(() => {
    if (settings.hideSignal === lastHideSignal.current) {
      return;
    }
    lastHideSignal.current = settings.hideSignal;
    showTimeline.current?.pause(0);
    hideTimeline.current?.seek(0).play();
  }, [settings.hideSignal]);

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

function createDiffuseTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const stripe = Math.sin((y / size) * Math.PI * 8) * 0.5 + 0.5;
      const tint = 0.25 + Math.sin((x / size) * Math.PI * 2) * 0.15;
      const base = THREE.MathUtils.clamp(stripe * 0.7 + tint, 0, 1);
      data[i] = base * 255;
      data[i + 1] = base * 200;
      data[i + 2] = base * 150;
      data[i + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}
