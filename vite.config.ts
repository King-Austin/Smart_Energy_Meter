import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleApiRequest } from './src/services/apiServer';

// Vite Plugin to serve live REST backend endpoints directly on dev server
function meterApiServerPlugin(): Plugin {
  return {
    name: 'meter-api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          const handled = handleApiRequest(req, res);
          if (handled) return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    meterApiServerPlugin()
  ],
  server: {
    port: 5173,
    host: true
  }
});
