"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
} from "react";
import {
  BlendFunction,
  Effect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";
import * as THREE from "three";
import { Uniform, Vector2 } from "three";

import useScene, { type SceneContext } from "@/hooks/useScene";
import {
  EFECTO_MEDIA_ADJUSTMENT_DEFAULTS,
  resolveEfectoMediaAdjustments,
  type EfectoMediaAdjustments,
} from "@/utils/efectoMediaAdjustments";
import fragmentShader from "@/shaders/efecto-ascii-effect/fragment";
import mediaVertexShader from "@/shaders/efecto-media-image/vertex.glsl";
import mediaFragmentShader from "@/shaders/efecto-media-image/fragment.glsl";

const DEFAULT_RESOLUTION = new Vector2(1920, 1080);
const DEFAULT_MOUSE_POSITION = new Vector2(0, 0);
const PARALLAX_LERP = 0.12;
const MEDIA_ADJUSTMENT_DEFAULTS = EFECTO_MEDIA_ADJUSTMENT_DEFAULTS;

const STYLE_MAP = {
  standard: 0,
  dense: 1,
  minimal: 2,
  blocks: 3,
} as const;

const COLOR_PALETTE_MAP = {
  original: 0,
  green: 1,
  amber: 2,
  cyan: 3,
  blue: 4,
} as const;

type PostProcessingSettings = {
  scanlineIntensity: number;
  scanlineCount: number;
  targetFPS: number;
  jitterIntensity: number;
  jitterSpeed: number;
  mouseGlowEnabled: boolean;
  mouseGlowRadius: number;
  mouseGlowIntensity: number;
  vignetteIntensity: number;
  vignetteRadius: number;
  colorPalette: number;
  curvature: number;
  aberrationStrength: number;
  noiseIntensity: number;
  noiseScale: number;
  noiseSpeed: number;
  waveAmplitude: number;
  waveFrequency: number;
  waveSpeed: number;
  glitchIntensity: number;
  glitchFrequency: number;
  brightnessAdjust: number;
  contrastAdjust: number;
};

export const EFECTO_ASCII_COMPONENT_DEFAULTS = {
  cellSize: 8,
  invert: false,
  colorMode: true,
  asciiStyle: "standard" as const,
} as const;

export const EFECTO_ASCII_POST_PROCESSING_DEFAULTS: PostProcessingSettings = {
  scanlineIntensity: 0,
  scanlineCount: 200,
  targetFPS: 0,
  jitterIntensity: 0,
  jitterSpeed: 0,
  mouseGlowEnabled: false,
  mouseGlowRadius: 200,
  mouseGlowIntensity: 1.5,
  vignetteIntensity: 0,
  vignetteRadius: 0.8,
  colorPalette: COLOR_PALETTE_MAP.original,
  curvature: 0,
  aberrationStrength: 0,
  noiseIntensity: 0,
  noiseScale: 0.1,
  noiseSpeed: 0,
  waveAmplitude: 0,
  waveFrequency: 3,
  waveSpeed: 0.2,
  glitchIntensity: 0,
  glitchFrequency: 0,
  brightnessAdjust: 0,
  contrastAdjust: 1,
};

const normalizePostProcessing = (
  overrides?: Partial<PublicPostProcessingSettings>
): PostProcessingSettings => {
  const { colorPalette: overridePalette, ...otherOverrides } = overrides ?? {};
  const merged: PostProcessingSettings = {
    ...EFECTO_ASCII_POST_PROCESSING_DEFAULTS,
    ...(otherOverrides as Partial<PostProcessingSettings>),
  };

  const paletteValue =
    overridePalette === undefined
      ? merged.colorPalette
      : typeof overridePalette === "string"
      ? COLOR_PALETTE_MAP[
          overridePalette.toLowerCase() as EfectoAsciiColorPalette
        ] ?? COLOR_PALETTE_MAP.original
      : overridePalette;

  return { ...merged, colorPalette: paletteValue };
};

type EfectoAsciiStyle = keyof typeof STYLE_MAP;
type EfectoAsciiColorPalette = keyof typeof COLOR_PALETTE_MAP;

type PublicPostProcessingSettings = Omit<
  PostProcessingSettings,
  "colorPalette"
> & { colorPalette: keyof typeof COLOR_PALETTE_MAP | number };

type AsciiEffectUniformProps = {
  cellSize: number;
  invert: boolean;
  colorMode: boolean;
  asciiStyle: number;
  resolution: Vector2;
  mousePos: Vector2;
} & PostProcessingSettings;

type AsciiEffectOptions = {
  asciiStyle: EfectoAsciiStyle;
  cellSize: number;
  invert: boolean;
  colorMode: boolean;
  resolution?: Vector2;
  mousePosition?: Vector2;
  postProcessing?: Partial<PublicPostProcessingSettings>;
  imageUrl?: string;
  mediaAdjustments?: EfectoMediaAdjustments;
  mouseParallax?: boolean;
  parallaxIntensity?: number;
};

type AsciiEffectProps = Partial<Omit<AsciiEffectOptions, "postProcessing">> & {
  postProcessing?: Partial<PublicPostProcessingSettings>;
};

type AsciiEffectRendererProps = AsciiEffectProps &
  Omit<ComponentProps<"div">, "ref" | "width" | "height"> & {
    width?: string | number;
    height?: string | number;
  };

class AsciiEffectImpl extends Effect {
  private time = 0;
  private deltaAccumulator = 0;

  constructor(initialProps: AsciiEffectUniformProps) {
    const uniformEntries: Array<[string, Uniform<any>]> = [
      ["cellSize", new Uniform(initialProps.cellSize)],
      ["invert", new Uniform(initialProps.invert)],
      ["colorMode", new Uniform(initialProps.colorMode)],
      ["asciiStyle", new Uniform(initialProps.asciiStyle)],
      ["time", new Uniform(0)],
      ["resolution", new Uniform(initialProps.resolution.clone())],
      ["mousePos", new Uniform(initialProps.mousePos.clone())],
      ["scanlineIntensity", new Uniform(initialProps.scanlineIntensity)],
      ["scanlineCount", new Uniform(initialProps.scanlineCount)],
      ["targetFPS", new Uniform(initialProps.targetFPS)],
      ["jitterIntensity", new Uniform(initialProps.jitterIntensity)],
      ["jitterSpeed", new Uniform(initialProps.jitterSpeed)],
      ["mouseGlowEnabled", new Uniform(initialProps.mouseGlowEnabled)],
      ["mouseGlowRadius", new Uniform(initialProps.mouseGlowRadius)],
      ["mouseGlowIntensity", new Uniform(initialProps.mouseGlowIntensity)],
      ["vignetteIntensity", new Uniform(initialProps.vignetteIntensity)],
      ["vignetteRadius", new Uniform(initialProps.vignetteRadius)],
      ["colorPalette", new Uniform(initialProps.colorPalette)],
      ["curvature", new Uniform(initialProps.curvature)],
      ["aberrationStrength", new Uniform(initialProps.aberrationStrength)],
      ["noiseIntensity", new Uniform(initialProps.noiseIntensity)],
      ["noiseScale", new Uniform(initialProps.noiseScale)],
      ["noiseSpeed", new Uniform(initialProps.noiseSpeed)],
      ["waveAmplitude", new Uniform(initialProps.waveAmplitude)],
      ["waveFrequency", new Uniform(initialProps.waveFrequency)],
      ["waveSpeed", new Uniform(initialProps.waveSpeed)],
      ["glitchIntensity", new Uniform(initialProps.glitchIntensity)],
      ["glitchFrequency", new Uniform(initialProps.glitchFrequency)],
      ["brightnessAdjust", new Uniform(initialProps.brightnessAdjust)],
      ["contrastAdjust", new Uniform(initialProps.contrastAdjust)],
    ];

    super("AsciiEffect", fragmentShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map(uniformEntries),
    });
  }

  updateUniforms(nextProps: Partial<AsciiEffectUniformProps>) {
    if (nextProps.cellSize !== undefined) {
      this.uniforms.get("cellSize")!.value = nextProps.cellSize;
    }

    if (nextProps.invert !== undefined) {
      this.uniforms.get("invert")!.value = nextProps.invert;
    }

    if (nextProps.colorMode !== undefined) {
      this.uniforms.get("colorMode")!.value = nextProps.colorMode;
    }

    if (nextProps.asciiStyle !== undefined) {
      this.uniforms.get("asciiStyle")!.value = nextProps.asciiStyle;
    }

    if (nextProps.resolution) {
      this.setVector2Uniform("resolution", nextProps.resolution);
    }

    if (nextProps.mousePos) {
      this.setVector2Uniform("mousePos", nextProps.mousePos);
    }

    const uniformKeys = Object.keys(
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS
    ) as Array<keyof PostProcessingSettings>;
    for (const key of uniformKeys) {
      if (nextProps[key] !== undefined) {
        this.uniforms.get(key)!.value = nextProps[key];
      }
    }
  }

  private setVector2Uniform(key: string, nextValue: Vector2) {
    const uniform = this.uniforms.get(key);
    if (!uniform) {
      return;
    }

    if (uniform.value instanceof Vector2) {
      uniform.value.copy(nextValue);
      return;
    }

    uniform.value = nextValue.clone();
  }

  override update(
    _renderer: THREE.WebGLRenderer,
    _inputBuffer: THREE.WebGLRenderTarget,
    deltaTime: number
  ) {
    const targetFPS = this.uniforms.get("targetFPS")!.value as number;

    if (targetFPS > 0) {
      const frameDuration = 1 / targetFPS;
      this.deltaAccumulator += deltaTime;
      if (this.deltaAccumulator >= frameDuration) {
        this.time += frameDuration;
        this.deltaAccumulator = this.deltaAccumulator % frameDuration;
      }
    } else {
      this.time += deltaTime;
    }

    this.uniforms.get("time")!.value = this.time;
  }
}

type MediaUniforms = {
  map: { value: THREE.Texture | null };
  brightness: { value: number };
  contrast: { value: number };
  saturation: { value: number };
  uvScale: { value: Vector2 };
  uvOffset: { value: Vector2 };
};

type SceneAssets = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  geometry: THREE.PlaneGeometry;
  material: THREE.ShaderMaterial;
};

export function AsciiEffect({
  cellSize = EFECTO_ASCII_COMPONENT_DEFAULTS.cellSize,
  invert = EFECTO_ASCII_COMPONENT_DEFAULTS.invert,
  colorMode = EFECTO_ASCII_COMPONENT_DEFAULTS.colorMode,
  asciiStyle: asciiStyleProp = EFECTO_ASCII_COMPONENT_DEFAULTS.asciiStyle,
  imageUrl,
  resolution,
  mousePosition,
  postProcessing = {},
  mediaAdjustments,
  mouseParallax = false,
  parallaxIntensity = 0.5,
  className,
  style,
  width,
  height,
  ...divProps
}: AsciiEffectRendererProps) {
  const composerRef = useRef<EffectComposer | null>(null);
  const effectRef = useRef<AsciiEffectImpl | null>(null);
  const assetsRef = useRef<SceneAssets | null>(null);
  const loadedTextureRef = useRef<THREE.Texture | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const mediaUniformsRef = useRef<MediaUniforms>({
    map: { value: null },
    brightness: { value: EFECTO_MEDIA_ADJUSTMENT_DEFAULTS.brightness },
    contrast: { value: EFECTO_MEDIA_ADJUSTMENT_DEFAULTS.contrast },
    saturation: { value: EFECTO_MEDIA_ADJUSTMENT_DEFAULTS.saturation },
    uvScale: { value: new Vector2(1, 1) },
    uvOffset: { value: new Vector2(0, 0) },
  });
  const pointerBoundsRef = useRef({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });
  const manualResolutionRef = useRef<Vector2 | null>(
    resolution ? resolution.clone() : null
  );
  manualResolutionRef.current = resolution ? resolution.clone() : null;
  const resolutionRef = useRef<Vector2>(
    manualResolutionRef.current
      ? manualResolutionRef.current.clone()
      : DEFAULT_RESOLUTION.clone()
  );
  const autoMouseRef = useRef<Vector2>(DEFAULT_MOUSE_POSITION.clone());
  const usesExternalMouseRef = useRef<boolean>(Boolean(mousePosition));
  usesExternalMouseRef.current = Boolean(mousePosition);
  const viewportSizeRef = useRef({ width: 1, height: 1 });
  const meshDisplaySizeRef = useRef({ width: 1, height: 1 });
  const parallaxStateRef = useRef({
    targetX: 0,
    targetY: 0,
    rotationX: 0,
    rotationY: 0,
  });
  const parallaxIntensityRef = useRef(
    THREE.MathUtils.clamp(parallaxIntensity ?? 0, 0, 1)
  );
  parallaxIntensityRef.current = THREE.MathUtils.clamp(
    parallaxIntensity ?? 0,
    0,
    1
  );

  const normalizedStyle =
    typeof asciiStyleProp === "string"
      ? (asciiStyleProp.toLowerCase() as EfectoAsciiStyle) ??
        EFECTO_ASCII_COMPONENT_DEFAULTS.asciiStyle
      : EFECTO_ASCII_COMPONENT_DEFAULTS.asciiStyle;
  const asciiStyle = STYLE_MAP[normalizedStyle] ?? STYLE_MAP.standard;

  const resolvedPostProcessing = useMemo(
    () => normalizePostProcessing(postProcessing),
    [postProcessing]
  );
  const resolvedMediaAdjustments = useMemo(
    () => resolveEfectoMediaAdjustments(mediaAdjustments),
    [mediaAdjustments]
  );

  const initialEffectPropsRef = useRef<AsciiEffectUniformProps | null>(null);
  if (!initialEffectPropsRef.current) {
    initialEffectPropsRef.current = {
      cellSize,
      invert,
      colorMode,
      asciiStyle,
      resolution: resolutionRef.current.clone(),
      mousePos: (mousePosition ?? DEFAULT_MOUSE_POSITION).clone(),
      ...resolvedPostProcessing,
    };
  }

  const updateTextureUVTransform = useCallback(() => {
    const texture = loadedTextureRef.current;
    if (!texture || !texture.image) {
      return;
    }

    const { width: planeWidth, height: planeHeight } =
      meshDisplaySizeRef.current;
    if (planeWidth <= 0 || planeHeight <= 0) {
      return;
    }

    const image = texture.image as { width: number; height: number };
    if (!image.width || !image.height) {
      return;
    }

    const imageAspect = image.width / image.height;
    const planeAspect = planeWidth / planeHeight;
    let scaleX = 1;
    let scaleY = 1;

    if (imageAspect > planeAspect) {
      scaleX = imageAspect / planeAspect;
    } else {
      scaleY = planeAspect / imageAspect;
    }

    const uvScaleX = 1 / scaleX;
    const uvScaleY = 1 / scaleY;
    const offsetX = (1 - uvScaleX) * 0.5;
    const offsetY = (1 - uvScaleY) * 0.5;

    mediaUniformsRef.current.uvScale.value.set(uvScaleX, uvScaleY);
    mediaUniformsRef.current.uvOffset.value.set(offsetX, offsetY);
    const assets = assetsRef.current;
    if (assets) {
      (assets.material.uniforms.uvScale.value as Vector2).set(
        uvScaleX,
        uvScaleY
      );
      (assets.material.uniforms.uvOffset.value as Vector2).set(
        offsetX,
        offsetY
      );
    }
  }, []);

  const updateMeshScale = useCallback(() => {
    const assets = assetsRef.current;
    if (!assets) return;

    const { width, height } = viewportSizeRef.current;
    const camera = cameraRef.current;
    let viewWidth = width;
    let viewHeight = height;

    if (camera instanceof THREE.PerspectiveCamera) {
      const distance = Math.abs(camera.position.z - assets.mesh.position.z);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      viewHeight = 2 * Math.tan(verticalFov / 2) * distance;
      viewWidth = viewHeight * camera.aspect;
    }

    const texture = loadedTextureRef.current;
    if (!texture || !texture.image) {
      assets.mesh.scale.set(viewWidth, viewHeight, 1);
      meshDisplaySizeRef.current = { width: viewWidth, height: viewHeight };
      return;
    }

    const image = texture.image as { width: number; height: number };
    const imageAspect =
      image.width && image.height ? image.width / Math.max(1, image.height) : 1;
    const viewportAspect = viewWidth / Math.max(1, viewHeight);

    let meshWidth = viewWidth;
    let meshHeight = viewHeight;

    if (imageAspect > viewportAspect) {
      meshHeight = viewHeight;
      meshWidth = viewHeight * imageAspect;
    } else {
      meshWidth = viewWidth;
      meshHeight = viewWidth / Math.max(0.0001, imageAspect);
    }

    assets.mesh.scale.set(meshWidth, meshHeight, 1);
    meshDisplaySizeRef.current = { width: meshWidth, height: meshHeight };
    updateTextureUVTransform();
  }, [updateTextureUVTransform]);

  const updatePointerBounds = useCallback(
    (container: HTMLDivElement | null = containerRef.current) => {
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      pointerBoundsRef.current = {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width || 1,
        height: bounds.height || 1,
      };
    },
    []
  );

  const resetParallax = useCallback(() => {
    parallaxStateRef.current.targetX = 0;
    parallaxStateRef.current.targetY = 0;
    parallaxStateRef.current.rotationX = 0;
    parallaxStateRef.current.rotationY = 0;
    const mesh = assetsRef.current?.mesh;
    if (mesh) {
      mesh.rotation.x = 0;
      mesh.rotation.y = 0;
    }
  }, []);

  const handleCreate = useCallback(
    ({ scene, camera, renderer, size }: SceneContext) => {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;

      if (!manualResolutionRef.current) {
        resolutionRef.current.set(size.width, size.height);
      }

      viewportSizeRef.current = { width: size.width, height: size.height };
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.ShaderMaterial({
        vertexShader: mediaVertexShader,
        fragmentShader: mediaFragmentShader,
        uniforms: mediaUniformsRef.current,
        transparent: true,
        depthTest: false,
      });
      material.toneMapped = false;
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      if (loadedTextureRef.current) {
        mediaUniformsRef.current.map.value = loadedTextureRef.current;
        material.uniforms.map.value = loadedTextureRef.current;
      }
      assetsRef.current = { mesh, geometry, material };
      cameraRef.current = camera;
      updateMeshScale();

      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      const effect = new AsciiEffectImpl({
        ...initialEffectPropsRef.current!,
        resolution: resolutionRef.current.clone(),
      });
      const effectPass = new EffectPass(camera, effect);
      effectPass.renderToScreen = true;
      composer.addPass(renderPass);
      composer.addPass(effectPass);
      composer.setSize(size.width, size.height);

      composerRef.current = composer;
      effectRef.current = effect;
      return () => {
        composer.dispose();
        if (assetsRef.current) {
          scene.remove(assetsRef.current.mesh);
          assetsRef.current.geometry.dispose();
          assetsRef.current.material.dispose();
          assetsRef.current = null;
        }
        cameraRef.current = null;
        loadedTextureRef.current?.dispose();
        loadedTextureRef.current = null;
        composerRef.current = null;
        effectRef.current = null;
      };
    },
    [updateMeshScale]
  );

  const handleRender = useCallback(
    (_context: SceneContext, delta: number, _elapsed: number) => {
      const assets = assetsRef.current;
      if (assets) {
        const enabled =
          mouseParallax && parallaxIntensityRef.current > 0 && assets.mesh;
        if (enabled) {
          parallaxStateRef.current.rotationX +=
            (parallaxStateRef.current.targetX -
              parallaxStateRef.current.rotationX) *
            PARALLAX_LERP;
          parallaxStateRef.current.rotationY +=
            (parallaxStateRef.current.targetY -
              parallaxStateRef.current.rotationY) *
            PARALLAX_LERP;
          assets.mesh.rotation.x = parallaxStateRef.current.rotationX;
          assets.mesh.rotation.y = parallaxStateRef.current.rotationY;
        } else if (
          Math.abs(assets.mesh.rotation.x) > 1e-3 ||
          Math.abs(assets.mesh.rotation.y) > 1e-3
        ) {
          assets.mesh.rotation.x *= 0.9;
          assets.mesh.rotation.y *= 0.9;
        }
      }

      composerRef.current?.render(delta);
    },
    [mouseParallax]
  );

  const handleResize = useCallback(
    (_context: SceneContext, size: { width: number; height: number }) => {
      const composer = composerRef.current;
      composer?.setSize(size.width, size.height);
      viewportSizeRef.current = { width: size.width, height: size.height };
      updateMeshScale();
      updatePointerBounds(containerRef.current);

      if (manualResolutionRef.current) {
        resolutionRef.current.copy(manualResolutionRef.current);
      } else {
        resolutionRef.current.set(size.width, size.height);
      }
      effectRef.current?.updateUniforms({
        resolution: resolutionRef.current,
      });

      if (!usesExternalMouseRef.current) {
        autoMouseRef.current.set(size.width / 2, size.height / 2);
        effectRef.current?.updateUniforms({ mousePos: autoMouseRef.current });
      }
    },
    [updateMeshScale, updatePointerBounds]
  );

  const { containerRef, contextRef } = useScene({
    camera: {
      type: "perspective",
      near: 0.1,
      far: 100,
      position: [0, 0, 10],
      fov: 50,
    },
    onCreate: handleCreate,
    onRender: handleRender,
    onResize: handleResize,
    manualRender: true,
  });

  useEffect(() => {
    if (!mouseParallax) {
      resetParallax();
    }
  }, [mouseParallax, resetParallax]);

  useEffect(() => {
    if (!imageUrl) return;

    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        loadedTextureRef.current?.dispose();
        loadedTextureRef.current = texture;

        mediaUniformsRef.current.map.value = texture;
        const assets = assetsRef.current;
        if (assets) {
          assets.material.uniforms.map.value = texture;
        }

        updateMeshScale();
        updateTextureUVTransform();
      },
      undefined,
      () => {
        if (disposed) return;
        loadedTextureRef.current?.dispose();
        loadedTextureRef.current = null;
      }
    );

    return () => {
      disposed = true;
    };
  }, [imageUrl, updateMeshScale, updateTextureUVTransform]);

  useEffect(() => {
    const effect = effectRef.current;
    if (!effect) return;

    effect.updateUniforms({
      cellSize,
      invert,
      colorMode,
      asciiStyle,
    });
  }, [asciiStyle, cellSize, colorMode, invert]);

  useEffect(() => {
    if (!effectRef.current) return;
    effectRef.current.updateUniforms(resolvedPostProcessing);
  }, [resolvedPostProcessing]);

  useEffect(() => {
    mediaUniformsRef.current.brightness.value =
      resolvedMediaAdjustments.brightness;
    mediaUniformsRef.current.contrast.value = resolvedMediaAdjustments.contrast;
    mediaUniformsRef.current.saturation.value =
      resolvedMediaAdjustments.saturation;

    const material = assetsRef.current?.material;
    if (material) {
      material.uniforms.brightness.value = resolvedMediaAdjustments.brightness;
      material.uniforms.contrast.value = resolvedMediaAdjustments.contrast;
      material.uniforms.saturation.value = resolvedMediaAdjustments.saturation;
    }
  }, [resolvedMediaAdjustments]);

  useEffect(() => {
    if (!mousePosition || !effectRef.current) return;
    effectRef.current.updateUniforms({ mousePos: mousePosition });
  }, [mousePosition]);

  useEffect(() => {
    if (!resolution || !effectRef.current) return;
    resolutionRef.current.copy(resolution);
    manualResolutionRef.current = resolution.clone();
    effectRef.current.updateUniforms({ resolution });
  }, [resolution]);

  useEffect(() => {
    if (mousePosition) return;
    const container = containerRef.current;
    if (!container) return;

    updatePointerBounds(container);

    const updateFromEvent = (event: PointerEvent) => {
      const bounds = pointerBoundsRef.current;
      autoMouseRef.current.set(
        event.clientX - bounds.left,
        bounds.height - (event.clientY - bounds.top)
      );
      effectRef.current?.updateUniforms({ mousePos: autoMouseRef.current });

      if (mouseParallax && bounds.width > 0 && bounds.height > 0) {
        const normalizedX =
          ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const normalizedY =
          ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        const intensity = parallaxIntensityRef.current;
        parallaxStateRef.current.targetY = 0.3 * normalizedX * intensity;
        parallaxStateRef.current.targetX = -0.2 * normalizedY * intensity;
      }
    };

    const handlePointerEnter = () => {
      updatePointerBounds();
    };

    const resetToCenter = () => {
      const size = contextRef.current?.size ?? {
        width: container.clientWidth || 1,
        height: container.clientHeight || 1,
      };
      autoMouseRef.current.set(size.width / 2, size.height / 2);
      effectRef.current?.updateUniforms({ mousePos: autoMouseRef.current });
      if (mouseParallax) {
        resetParallax();
      }
    };

    resetToCenter();
    container.addEventListener("pointermove", updateFromEvent);
    container.addEventListener("pointerenter", handlePointerEnter);
    container.addEventListener("pointerleave", resetToCenter);

    return () => {
      container.removeEventListener("pointermove", updateFromEvent);
      container.removeEventListener("pointerenter", handlePointerEnter);
      container.removeEventListener("pointerleave", resetToCenter);
    };
  }, [
    containerRef,
    contextRef,
    mouseParallax,
    mousePosition,
    resetParallax,
    updatePointerBounds,
  ]);

  useEffect(() => {
    parallaxIntensityRef.current = THREE.MathUtils.clamp(
      parallaxIntensity ?? 0,
      0,
      1
    );
  }, [parallaxIntensity]);

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

export type {
  EfectoAsciiStyle,
  EfectoAsciiColorPalette,
  PostProcessingSettings as AsciiPostProcessingSettings,
  PublicPostProcessingSettings as EfectoPublicAsciiPostProcessingSettings,
  AsciiEffectImpl as AsciiEffectHandle,
  AsciiEffectProps,
  AsciiEffectRendererProps,
};
