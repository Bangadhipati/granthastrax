import { defineConfig, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Custom Vite plugin that replaces browser-only packages with empty stubs
 * during the SSR build. This prevents react-pdf / pdfjs-dist from ever
 * being imported on the server, which would crash with "DOMMatrix is not defined".
 */
function ssrBrowserStub(): Plugin {
  const BROWSER_ONLY = ["react-pdf", "pdfjs-dist"];
  const STUB_ID = "\0ssr-browser-stub";

  return {
    name: "ssr-browser-stub",
    enforce: "pre",
    resolveId(id, _importer, options) {
      if (options.ssr && BROWSER_ONLY.some((pkg) => id === pkg || id.startsWith(pkg + "/"))) {
        return STUB_ID;
      }
    },
    load(id) {
      if (id === STUB_ID) {
        // Return an empty module that exports harmless stubs
        return `
          export default {};
          export const Document = () => null;
          export const Page = () => null;
          export const pdfjs = { version: "0.0.0", GlobalWorkerOptions: {} };
        `;
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    ssrBrowserStub(),
    command === "build" ? netlify() : undefined,
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
}));
