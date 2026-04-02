import * as ShaderUI from "@toriistudio/shader-ui";

declare global {
  interface Window {
    __TEST_PROPS__: Record<string, unknown>;
    __TEST_COMPONENT__: string;
    __TEST_READY__: boolean;
  }
}

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const component = params.get("component") || "";
  const propsRaw = params.get("props") || "{}";

  let props: Record<string, unknown> = {};
  try {
    props = JSON.parse(propsRaw);
  } catch {
    console.error("Failed to parse props from URL");
  }

  return { component, props };
}

export default function App() {
  const { component, props } = parseUrlParams();

  const Component = (ShaderUI as Record<string, React.ComponentType<any>>)[
    component
  ];

  window.__TEST_COMPONENT__ = component;
  window.__TEST_PROPS__ = props;
  window.__TEST_READY__ = true;

  if (!Component) {
    return (
      <div data-testid="sandbox-error">
        Component "{component}" not found in @toriistudio/shader-ui
      </div>
    );
  }

  return (
    <div data-testid="sandbox-root" style={{ width: "100%", height: "100%" }}>
      <Component width="100%" height="100%" {...props} />
    </div>
  );
}
