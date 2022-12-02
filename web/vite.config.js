import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    target: 'es2021',
    commonjsOptions: {transformMixedEsModules: true},
    lib: {
      entry: 'web/src/app.js',
      name: 'test',
      fileName: 'client',
    },
    outDir: 'dist/client',
    rollupOptions: {
      external: [
          //'../../resources/**',
          //'../../examples/**'
      ]
    },
    minify: 'esbuild',
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {src: 'node_modules/bpmn-js/dist/assets/bpmn-font/css/**', dest: 'assets/bpmn-font/css/'},
        {src: 'node_modules/bpmn-js/dist/assets/bpmn-font/font/**', dest: 'assets/bpmn-font/font/'}
      ]
    })
  ],
});