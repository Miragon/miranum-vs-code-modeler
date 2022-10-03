import { defineConfig } from "tsup";

export default defineConfig({
    entry: [
        'src/extension.ts',
        'resources/js/app.js'
    ],
    outDir: 'dist',
    format: ['cjs'],
    sourcemap: true,
    external: [
        'vscode'
    ],
    dts: 'src/extension.ts',
    onSuccess: "cp -r ./resources/css ./dist/resources/. && cp -r ./node_modules/bpmn-js/dist/assets ./dist/resources/css"
})