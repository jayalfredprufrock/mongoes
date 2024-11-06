/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: {
                mongoes: 'src/index.ts',
                sift: 'src/sift.ts',
                util: 'src/util.ts',
            },
            formats: ['es', 'cjs'],
            fileName: (format: string, entryName: string) => `${entryName}.${format}.js`,
        },
        rollupOptions: {
            external: ['sift'],
            output: {
                sourcemapExcludeSources: true,
            },
        },
        sourcemap: true,
        target: 'es2022',
        minify: false,
    },
    plugins: [dts({ rollupTypes: true })],
    test: {
        globals: true,
    },
});
