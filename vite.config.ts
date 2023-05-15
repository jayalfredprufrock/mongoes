import { defineConfig } from 'vite';
import { dts } from 'vite-dts';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es', 'cjs'],
            fileName: format => `mongoes.${format}.js`,
        },
        rollupOptions: {
            output: {
                sourcemapExcludeSources: true,
            },
        },
        sourcemap: true,
        target: 'es2022',
        minify: false,
    },
    plugins: [dts()],
    test: {
        globals: true,
    },
} as any);
