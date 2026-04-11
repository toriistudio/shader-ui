import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    },
  },
  webServer: [
    {
      command: "cd examples/shader-art && yarn install && npx vite --port 5173",
      port: 5173,
      cwd: "../",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "cd e2e/sandbox && yarn install && npx vite --port 5174",
      port: 5174,
      cwd: "../",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "cd examples/dense-fluid && yarn install && npx vite --port 5175",
      port: 5175,
      cwd: "../",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
