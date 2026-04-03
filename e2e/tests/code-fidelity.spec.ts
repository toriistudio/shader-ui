import { test, expect } from "@playwright/test";
import { parseJsxProps } from "../utils/parse-jsx-props";

const SANDBOX_URL = "http://localhost:5174";

type ControlConfig = {
  label: string;
  value: string;
  /** Dot-path to find this value in the parsed snippet props (e.g. "uniforms.uAmplitude") */
  propPath: string;
};

type ExampleConfig = {
  slug: string;
  component: string;
  port: number;
  controls: ControlConfig[];
};

const EXAMPLES: ExampleConfig[] = [
  {
    slug: "shader-art",
    component: "ShaderArt",
    port: 5173,
    controls: [
      { label: "uAmplitude", value: "1.2", propPath: "uniforms.uAmplitude" },
      { label: "uFreq", value: "2.0", propPath: "uniforms.uFreq" },
    ],
  },
  {
    slug: "fluid-amber-radiant",
    component: "FluidAmberRadiant",
    port: 5175,
    controls: [
      { label: "timeScale", value: "0.25", propPath: "timeScale" },
      { label: "ampDecay", value: "0.6", propPath: "ampDecay" },
    ],
  },
];

/** Resolve a dot-path like "uniforms.uAmplitude" on an object */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

for (const example of EXAMPLES) {
  test.describe(example.slug, () => {
    test("copied code snippet renders the same component with matching props", async ({
      page,
      context,
    }) => {
      // 1. Open the playground
      await page.goto(`http://localhost:${example.port}`);
      await page.waitForSelector("canvas", { timeout: 15_000 });

      // 2. Adjust controls — find the number input next to its label
      for (const control of example.controls) {
        const container = page.locator(`label[for="${control.label}"]`).locator("..");
        const numberInput = container.locator('input[type="number"]');
        await numberInput.fill(control.value);
      }

      // 3. Open code snippet panel and extract the JSX
      const showCodeToggle = page.getByTestId("show-code-toggle");
      await showCodeToggle.click();

      const snippetEl = page.getByTestId("code-snippet");
      await snippetEl.waitFor({ state: "visible", timeout: 5_000 });
      const snippet = await snippetEl.textContent();
      expect(snippet).toBeTruthy();

      // 4. Parse the JSX into component name + props
      const { componentName, props } = parseJsxProps(snippet!);
      expect(componentName).toBe(example.component);

      // 5. Verify adjusted control values are present in the snippet
      for (const control of example.controls) {
        const actual = getByPath(props, control.propPath);
        expect(actual).toBeDefined();
        expect(Number(actual)).toBeCloseTo(Number(control.value), 1);
      }

      // 6. Open the sandbox with the parsed props
      const sandbox = await context.newPage();
      const propsParam = encodeURIComponent(JSON.stringify(props));
      await sandbox.goto(
        `${SANDBOX_URL}?component=${componentName}&props=${propsParam}`
      );

      // 7. Verify the sandbox rendered successfully
      await sandbox.waitForFunction(() => window.__TEST_READY__ === true, null, {
        timeout: 10_000,
      });

      // Verify no error state
      const errorEl = sandbox.getByTestId("sandbox-error");
      await expect(errorEl).toHaveCount(0);

      // Verify canvas rendered (WebGL component mounted)
      const canvas = sandbox.locator("canvas");
      await expect(canvas.first()).toBeVisible({ timeout: 10_000 });

      // 8. Verify the sandbox received the correct props
      const testProps = await sandbox.evaluate(() => window.__TEST_PROPS__) as Record<string, unknown>;
      for (const control of example.controls) {
        const actual = getByPath(testProps, control.propPath);
        expect(Number(actual)).toBeCloseTo(Number(control.value), 1);
      }
    });

    test("default state snippet renders without errors", async ({
      page,
      context,
    }) => {
      // Open playground without changing any controls
      await page.goto(`http://localhost:${example.port}`);
      await page.waitForSelector("canvas", { timeout: 15_000 });

      // Extract default snippet
      const showCodeToggle = page.getByTestId("show-code-toggle");
      await showCodeToggle.click();

      const snippetEl = page.getByTestId("code-snippet");
      await snippetEl.waitFor({ state: "visible", timeout: 5_000 });
      const snippet = await snippetEl.textContent();
      expect(snippet).toBeTruthy();

      const { componentName, props } = parseJsxProps(snippet!);

      // Render in sandbox
      const sandbox = await context.newPage();
      const propsParam = encodeURIComponent(JSON.stringify(props));
      await sandbox.goto(
        `${SANDBOX_URL}?component=${componentName}&props=${propsParam}`
      );

      await sandbox.waitForFunction(() => window.__TEST_READY__ === true, null, {
        timeout: 10_000,
      });

      const errorEl = sandbox.getByTestId("sandbox-error");
      await expect(errorEl).toHaveCount(0);

      const canvas = sandbox.locator("canvas");
      await expect(canvas.first()).toBeVisible({ timeout: 10_000 });
    });
  });
}
