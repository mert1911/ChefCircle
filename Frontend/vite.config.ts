import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // CRUCIAL: Add optimizeDeps to exclude problematic dependencies (retained)
  optimizeDeps: {
    exclude: [
      // 'lucide-react' is often reported to cause issues with Vite's dep optimizer.
      // If other modules cause similar errors, add them here (e.g., '@radix-ui/react-accordion').
      'lucide-react',
    ],
  },
}));

