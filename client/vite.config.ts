import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import viteCompression from "vite-plugin-compression";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Load environment variables from both the root directory and the client directory
    const rootEnvDir = path.resolve(__dirname, "..");
    const clientEnvDir = path.resolve(__dirname);
    
    // Load environment variables from both directories
    const rootEnv = loadEnv(mode, rootEnvDir, "");
    const clientEnv = loadEnv(mode, clientEnvDir, "");
    
    // Merge environment variables, prioritizing client variables
    const env = { ...rootEnv, ...clientEnv };
    
    return {
        plugins: [
            react(),
            viteCompression({
                algorithm: "brotliCompress",
                ext: ".br",
                threshold: 1024,
            }),
        ],
        clearScreen: false,
        // Set envDir to client directory to prioritize client-specific .env
        envDir: clientEnvDir,
        define: {
            "import.meta.env.VITE_SERVER_PORT": JSON.stringify(
                env.SERVER_PORT || "3000"
            ),
            "import.meta.env.VITE_SERVER_URL": JSON.stringify(
                env.SERVER_URL || "http://localhost"
            ),
            "import.meta.env.VITE_SERVER_BASE_URL": JSON.stringify(
                env.SERVER_BASE_URL
            ),
            // Add Supabase environment variables
            "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
                env.VITE_SUPABASE_URL
            ),
            "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
                env.VITE_SUPABASE_ANON_KEY
            ),
            // Add Clerk environment variables
            "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
                env.VITE_CLERK_PUBLISHABLE_KEY
            )
        },
        build: {
            outDir: "dist",
            minify: true,
            cssMinify: true,
            sourcemap: false,
            cssCodeSplit: true,
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
