import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Tach vendor lon (eager) ra chunk rieng de cache tot hon.
        // recharts duoc lazy-load (dynamic import) nen tu dong thanh chunk async rieng.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("socket.io") || id.includes("engine.io")) return "socket";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("/scheduler/")
          ) {
            return "react-vendor";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // WebSocket cho Socket.IO (real-time order book)
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
