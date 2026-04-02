import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    },
  },
  webServer: [
    {
      command: "cd examples/shader-art && yarn dev",
      port: 5173,
      cwd: "../",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "cd e2e/sandbox && yarn dev",
      port: 5174,
      cwd: "../",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
