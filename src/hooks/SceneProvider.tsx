"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";

import useScene, { type SceneContext } from "@/hooks/useScene";

type SceneProviderValue = {
  containerRef: ReturnType<typeof useScene>["containerRef"];
  contextRef: ReturnType<typeof useScene>["contextRef"];
  size: ReturnType<typeof useScene>["size"];
  ready: ReturnType<typeof useScene>["ready"];
};

const SceneProviderContext = createContext<SceneProviderValue | null>(null);

type SceneProviderProps = PropsWithChildren<{
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  manualRender?: boolean;
  onRender?: (
    context: SceneContext,
    deltaTime: number,
    elapsedTime: number
  ) => void;
}>;

export function SceneProvider({
  children,
  width = "100%",
  height = "100%",
  className,
  style,
  manualRender = true,
  onRender,
}: SceneProviderProps) {
  const { containerRef, contextRef, size, ready } = useScene({
    manualRender,
    onRender,
  });

  return (
    <SceneProviderContext.Provider
      value={{ containerRef, contextRef, size, ready }}
    >
      <div
        ref={containerRef}
        className={className}
        style={{
          width,
          height,
          position: "relative",
          ...style,
        }}
      >
        {children}
      </div>
    </SceneProviderContext.Provider>
  );
}

export function useSceneContext() {
  return useContext(SceneProviderContext);
}
