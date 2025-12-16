import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { prerender } from "vite-plugin-prerender";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" &&
      prerender({
        routes: ["/", "/success", "/privacy", "/terms"],
        renderer: prerender.renderer({
          renderAfterDocumentEvent: "render-event",
          renderAfterTime: 1000, // Fallback timeout in ms
        }),
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
