// vite.config.ts
import { defineConfig } from "file:///E:/Modding/Games/BethesdaGameStudios/.tools/mod-planner/node_modules/.pnpm/vite@4.4.4/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///E:/Modding/Games/BethesdaGameStudios/.tools/mod-planner/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@2.4.2_svelte@4.0.5_vite@4.4.4/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import { nodePolyfills } from "file:///E:/Modding/Games/BethesdaGameStudios/.tools/mod-planner/node_modules/.pnpm/vite-plugin-node-polyfills@0.9.0_vite@4.4.4/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig(async () => ({
  plugins: [
    nodePolyfills({
      globals: {
        process: true
      }
    }),
    svelte()
  ],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true
  },
  // 3. to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ["VITE_", "TAURI_"]
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxNb2RkaW5nXFxcXEdhbWVzXFxcXEJldGhlc2RhR2FtZVN0dWRpb3NcXFxcLnRvb2xzXFxcXG1vZC1wbGFubmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxNb2RkaW5nXFxcXEdhbWVzXFxcXEJldGhlc2RhR2FtZVN0dWRpb3NcXFxcLnRvb2xzXFxcXG1vZC1wbGFubmVyXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9Nb2RkaW5nL0dhbWVzL0JldGhlc2RhR2FtZVN0dWRpb3MvLnRvb2xzL21vZC1wbGFubmVyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSBcIkBzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGVcIjtcclxuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhhc3luYyAoKSA9PiAoe1xyXG5cdHBsdWdpbnM6IFtcclxuXHRcdG5vZGVQb2x5ZmlsbHMoe1xyXG5cdFx0XHRnbG9iYWxzOiB7XHJcblx0XHRcdFx0cHJvY2VzczogdHJ1ZVxyXG5cdFx0XHR9XHJcblx0XHR9KSxcclxuXHRcdHN2ZWx0ZSgpXHJcblx0XSxcclxuXHJcblx0Ly8gVml0ZSBvcHRpb25zIHRhaWxvcmVkIGZvciBUYXVyaSBkZXZlbG9wbWVudCBhbmQgb25seSBhcHBsaWVkIGluIGB0YXVyaSBkZXZgIG9yIGB0YXVyaSBidWlsZGBcclxuXHQvL1xyXG5cdC8vIDEuIHByZXZlbnQgdml0ZSBmcm9tIG9ic2N1cmluZyBydXN0IGVycm9yc1xyXG5cdGNsZWFyU2NyZWVuOiBmYWxzZSxcclxuXHQvLyAyLiB0YXVyaSBleHBlY3RzIGEgZml4ZWQgcG9ydCwgZmFpbCBpZiB0aGF0IHBvcnQgaXMgbm90IGF2YWlsYWJsZVxyXG5cdHNlcnZlcjoge1xyXG5cdFx0cG9ydDogMTQyMCxcclxuXHRcdHN0cmljdFBvcnQ6IHRydWUsXHJcblx0fSxcclxuXHQvLyAzLiB0byBtYWtlIHVzZSBvZiBgVEFVUklfREVCVUdgIGFuZCBvdGhlciBlbnYgdmFyaWFibGVzXHJcblx0Ly8gaHR0cHM6Ly90YXVyaS5zdHVkaW8vdjEvYXBpL2NvbmZpZyNidWlsZGNvbmZpZy5iZWZvcmVkZXZjb21tYW5kXHJcblx0ZW52UHJlZml4OiBbXCJWSVRFX1wiLCBcIlRBVVJJX1wiXSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1XLFNBQVMsb0JBQW9CO0FBQ2hZLFNBQVMsY0FBYztBQUN2QixTQUFTLHFCQUFxQjtBQUc5QixJQUFPLHNCQUFRLGFBQWEsYUFBYTtBQUFBLEVBQ3hDLFNBQVM7QUFBQSxJQUNSLGNBQWM7QUFBQSxNQUNiLFNBQVM7QUFBQSxRQUNSLFNBQVM7QUFBQSxNQUNWO0FBQUEsSUFDRCxDQUFDO0FBQUEsSUFDRCxPQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsYUFBYTtBQUFBO0FBQUEsRUFFYixRQUFRO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDYjtBQUFBO0FBQUE7QUFBQSxFQUdBLFdBQVcsQ0FBQyxTQUFTLFFBQVE7QUFDOUIsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
