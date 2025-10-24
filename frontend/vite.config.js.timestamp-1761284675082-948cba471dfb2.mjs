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
        "^/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
          rewrite: (path2) => path2.replace(/^\/api/, "")
        },
        "^/auth": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
          rewrite: (path2) => path2.replace(/^\/auth/, "")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBYmVzZWxvbVxcXFxEZXNrdG9wXFxcXGNvZGluZ1xcXFxFLUNvbW1lcmNlICAwMVxcXFxtZXJuLWVjb21tZXJjZVxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQWJlc2Vsb21cXFxcRGVza3RvcFxcXFxjb2RpbmdcXFxcRS1Db21tZXJjZSAgMDFcXFxcbWVybi1lY29tbWVyY2VcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FiZXNlbG9tL0Rlc2t0b3AvY29kaW5nL0UtQ29tbWVyY2UlMjAlMjAwMS9tZXJuLWVjb21tZXJjZS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5IGFuZCBhbGwgcGFyZW50IGRpcmVjdG9yaWVzXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICBcbiAgLy8gSFRUUFMgY29uZmlndXJhdGlvblxuICBjb25zdCBodHRwc0NvbmZpZyA9IGZzLmV4aXN0c1N5bmMoJ2xvY2FsaG9zdC1rZXkucGVtJykgJiYgZnMuZXhpc3RzU3luYygnbG9jYWxob3N0LnBlbScpXG4gICAgPyB7XG4gICAgICAgIGtleTogZnMucmVhZEZpbGVTeW5jKCdsb2NhbGhvc3Qta2V5LnBlbScpLFxuICAgICAgICBjZXJ0OiBmcy5yZWFkRmlsZVN5bmMoJ2xvY2FsaG9zdC5wZW0nKSxcbiAgICAgIH1cbiAgICA6IGZhbHNlO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxuICAgIHNlcnZlcjoge1xuICAgICAgaHR0cHM6IGh0dHBzQ29uZmlnLFxuICAgICAgaG9zdDogdHJ1ZSxcbiAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgJ14vYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQVBJX0JBU0VfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgICAgfSxcbiAgICAgICAgJ14vYXV0aCc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGVudi5WSVRFX0FQSV9CQVNFX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJyxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXV0aC8sICcnKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29yczoge1xuICAgICAgICBvcmlnaW46IHRydWUsXG4gICAgICAgIGNyZWRlbnRpYWxzOiB0cnVlXG4gICAgICB9LFxuICAgICAgaG1yOiB7XG4gICAgICAgIHByb3RvY29sOiBodHRwc0NvbmZpZyA/ICd3c3MnIDogJ3dzJyxcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCdcbiAgICAgIH1cbiAgICB9LFxuICAgIGRlZmluZToge1xuICAgICAgJ3Byb2Nlc3MuZW52Jzoge31cbiAgICB9LFxuICAgIC8vIEhhbmRsZSBKU1ggZmlsZXNcbiAgICByZXNvbHZlOiB7XG4gICAgICBleHRlbnNpb25zOiBbJy5qcycsICcuanN4JywgJy5qc29uJ10sXG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpXG4gICAgICB9XG4gICAgfSxcbiAgICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nLCAncmVhY3QtdG9hc3RpZnknXSxcbiAgICAgIGZvcmNlOiB0cnVlXG4gICAgfSxcbiAgICAvLyBDbGVhciB0aGUgY2FjaGVcbiAgICBjYWNoZURpcjogJ25vZGVfbW9kdWxlcy8udml0ZScsXG4gICAgY2xlYXJTY3JlZW46IHRydWUsXG4gICAgLy8gSGFuZGxlIEpTWCBmaWxlcyBpbiBkZXZlbG9wbWVudFxuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGpzeEluamVjdDogYGltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdgXG4gICAgfVxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJaLFNBQVMsY0FBYyxlQUFlO0FBQ2pjLE9BQU8sV0FBVztBQUNsQixPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRzNDLFFBQU0sY0FBYyxHQUFHLFdBQVcsbUJBQW1CLEtBQUssR0FBRyxXQUFXLGVBQWUsSUFDbkY7QUFBQSxJQUNFLEtBQUssR0FBRyxhQUFhLG1CQUFtQjtBQUFBLElBQ3hDLE1BQU0sR0FBRyxhQUFhLGVBQWU7QUFBQSxFQUN2QyxJQUNBO0FBRUosU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLElBQ2pCLFFBQVE7QUFBQSxNQUNOLE9BQU87QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLE9BQU87QUFBQSxRQUNMLFNBQVM7QUFBQSxVQUNQLFFBQVEsSUFBSSxxQkFBcUI7QUFBQSxVQUNqQyxjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsVUFDUixTQUFTLENBQUNBLFVBQVNBLE1BQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxRQUM5QztBQUFBLFFBQ0EsVUFBVTtBQUFBLFVBQ1IsUUFBUSxJQUFJLHFCQUFxQjtBQUFBLFVBQ2pDLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxVQUNSLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFdBQVcsRUFBRTtBQUFBLFFBQy9DO0FBQUEsTUFDRjtBQUFBLE1BQ0EsTUFBTTtBQUFBLFFBQ0osUUFBUTtBQUFBLFFBQ1IsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBLEtBQUs7QUFBQSxRQUNILFVBQVUsY0FBYyxRQUFRO0FBQUEsUUFDaEMsTUFBTTtBQUFBLE1BQ1I7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixlQUFlLENBQUM7QUFBQSxJQUNsQjtBQUFBO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUCxZQUFZLENBQUMsT0FBTyxRQUFRLE9BQU87QUFBQSxNQUNuQyxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxTQUFTLGFBQWEsb0JBQW9CLGdCQUFnQjtBQUFBLE1BQ3BFLE9BQU87QUFBQSxJQUNUO0FBQUE7QUFBQSxJQUVBLFVBQVU7QUFBQSxJQUNWLGFBQWE7QUFBQTtBQUFBLElBRWIsU0FBUztBQUFBLE1BQ1AsV0FBVztBQUFBLElBQ2I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
