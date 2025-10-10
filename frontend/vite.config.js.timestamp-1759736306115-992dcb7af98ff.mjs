// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/Abeselom/Desktop/coding/E-Commerce%20%2001/mern-ecommerce/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Abeselom/Desktop/coding/E-Commerce%20%2001/mern-ecommerce/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import fs from "fs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Abeselom\\Desktop\\coding\\E-Commerce  01\\mern-ecommerce\\frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const httpsConfig = fs.existsSync("localhost-key.pem") && fs.existsSync("localhost.pem") ? {
    key: fs.readFileSync("localhost-key.pem"),
    cert: fs.readFileSync("localhost.pem")
  } : false;
  return {
    plugins: [react()],
    server: {
      https: httpsConfig,
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
          rewrite: (path2) => path2.replace(/^\/api/, "")
        },
        "/auth": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false
        }
      },
      cors: {
        origin: true,
        credentials: true
      },
      hmr: {
        protocol: httpsConfig ? "wss" : "ws",
        host: "localhost"
      }
    },
    define: {
      "process.env": {}
    },
    // Handle JSX files
    resolve: {
      extensions: [".js", ".jsx", ".json"],
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "react-toastify"],
      force: true
    },
    // Clear the cache
    cacheDir: "node_modules/.vite",
    clearScreen: true,
    // Handle JSX files in development
    esbuild: {
      jsxInject: `import React from 'react'`
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBYmVzZWxvbVxcXFxEZXNrdG9wXFxcXGNvZGluZ1xcXFxFLUNvbW1lcmNlICAwMVxcXFxtZXJuLWVjb21tZXJjZVxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQWJlc2Vsb21cXFxcRGVza3RvcFxcXFxjb2RpbmdcXFxcRS1Db21tZXJjZSAgMDFcXFxcbWVybi1lY29tbWVyY2VcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FiZXNlbG9tL0Rlc2t0b3AvY29kaW5nL0UtQ29tbWVyY2UlMjAlMjAwMS9tZXJuLWVjb21tZXJjZS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5IGFuZCBhbGwgcGFyZW50IGRpcmVjdG9yaWVzXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICBcbiAgLy8gSFRUUFMgY29uZmlndXJhdGlvblxuICBjb25zdCBodHRwc0NvbmZpZyA9IGZzLmV4aXN0c1N5bmMoJ2xvY2FsaG9zdC1rZXkucGVtJykgJiYgZnMuZXhpc3RzU3luYygnbG9jYWxob3N0LnBlbScpXG4gICAgPyB7XG4gICAgICAgIGtleTogZnMucmVhZEZpbGVTeW5jKCdsb2NhbGhvc3Qta2V5LnBlbScpLFxuICAgICAgICBjZXJ0OiBmcy5yZWFkRmlsZVN5bmMoJ2xvY2FsaG9zdC5wZW0nKSxcbiAgICAgIH1cbiAgICA6IGZhbHNlO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxuICAgIHNlcnZlcjoge1xuICAgICAgaHR0cHM6IGh0dHBzQ29uZmlnLFxuICAgICAgaG9zdDogdHJ1ZSxcbiAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBlbnYuVklURV9BUElfQkFTRV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKVxuICAgICAgICB9LFxuICAgICAgICAnL2F1dGgnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBlbnYuVklURV9BUElfQkFTRV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNvcnM6IHtcbiAgICAgICAgb3JpZ2luOiB0cnVlLFxuICAgICAgICBjcmVkZW50aWFsczogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGhtcjoge1xuICAgICAgICBwcm90b2NvbDogaHR0cHNDb25maWcgPyAnd3NzJyA6ICd3cycsXG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnXG4gICAgICB9XG4gICAgfSxcbiAgICBkZWZpbmU6IHtcbiAgICAgICdwcm9jZXNzLmVudic6IHt9XG4gICAgfSxcbiAgICAvLyBIYW5kbGUgSlNYIGZpbGVzXG4gICAgcmVzb2x2ZToge1xuICAgICAgZXh0ZW5zaW9uczogWycuanMnLCAnLmpzeCcsICcuanNvbiddLFxuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKVxuICAgICAgfVxuICAgIH0sXG4gICAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJywgJ3JlYWN0LXRvYXN0aWZ5J10sXG4gICAgICBmb3JjZTogdHJ1ZVxuICAgIH0sXG4gICAgLy8gQ2xlYXIgdGhlIGNhY2hlXG4gICAgY2FjaGVEaXI6ICdub2RlX21vZHVsZXMvLnZpdGUnLFxuICAgIGNsZWFyU2NyZWVuOiB0cnVlLFxuICAgIC8vIEhhbmRsZSBKU1ggZmlsZXMgaW4gZGV2ZWxvcG1lbnRcbiAgICBlc2J1aWxkOiB7XG4gICAgICBqc3hJbmplY3Q6IGBpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnYFxuICAgIH1cbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyWixTQUFTLGNBQWMsZUFBZTtBQUNqYyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUczQyxRQUFNLGNBQWMsR0FBRyxXQUFXLG1CQUFtQixLQUFLLEdBQUcsV0FBVyxlQUFlLElBQ25GO0FBQUEsSUFDRSxLQUFLLEdBQUcsYUFBYSxtQkFBbUI7QUFBQSxJQUN4QyxNQUFNLEdBQUcsYUFBYSxlQUFlO0FBQUEsRUFDdkMsSUFDQTtBQUVKLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQixRQUFRO0FBQUEsTUFDTixPQUFPO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRLElBQUkscUJBQXFCO0FBQUEsVUFDakMsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsVUFBVSxFQUFFO0FBQUEsUUFDOUM7QUFBQSxRQUNBLFNBQVM7QUFBQSxVQUNQLFFBQVEsSUFBSSxxQkFBcUI7QUFBQSxVQUNqQyxjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLE1BQU07QUFBQSxRQUNKLFFBQVE7QUFBQSxRQUNSLGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQSxLQUFLO0FBQUEsUUFDSCxVQUFVLGNBQWMsUUFBUTtBQUFBLFFBQ2hDLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sZUFBZSxDQUFDO0FBQUEsSUFDbEI7QUFBQTtBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1AsWUFBWSxDQUFDLE9BQU8sUUFBUSxPQUFPO0FBQUEsTUFDbkMsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLG9CQUFvQixnQkFBZ0I7QUFBQSxNQUNwRSxPQUFPO0FBQUEsSUFDVDtBQUFBO0FBQUEsSUFFQSxVQUFVO0FBQUEsSUFDVixhQUFhO0FBQUE7QUFBQSxJQUViLFNBQVM7QUFBQSxNQUNQLFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
