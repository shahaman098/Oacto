import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { quoteDeltaApiPlugin } from "./vite.api-plugin";

export default defineConfig({
  plugins: [react(), quoteDeltaApiPlugin()],
  server: {
    host: "127.0.0.1",
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
