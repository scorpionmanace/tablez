/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: 'tsconfig.app.json',
      include: ['src/lib'],
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        main: resolve(__dirname, 'src/lib/index.ts'),
        native: resolve(__dirname, 'src/lib/native/index.ts'),
      },
      name: 'Tablez',
      fileName: (format, entryName) => {
        const base = entryName === 'main' ? 'tablez' : entryName;
        // .cjs so Node treats the CommonJS build as CommonJS despite
        // "type": "module"; .js is fine for the ESM build.
        return format === 'es' ? `${base}.es.js` : `${base}.cjs`;
      },
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-native'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
