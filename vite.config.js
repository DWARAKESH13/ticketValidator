import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Dev-only proxy avoids browser CORS issues: set VITE_API_BASE=/api/transit-zero
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": { target: "https://internal.goxploronline.net", changeOrigin: true } } },
});
