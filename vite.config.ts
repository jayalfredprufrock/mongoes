import { defineConfig } from 'vite';
import { dts } from 'vite-dts';

export default defineConfig({
    build: {
        lib: {
            entry: {
                mongoes: 'src/index.ts',
                sift: 'src/sift.ts',
            },
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => `${entryName}.${format}.js`,
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
    plugins: [dts()],
    test: {
        globals: true,
    },
} as any);
