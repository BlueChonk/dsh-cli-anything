import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'lib',
  format: 'esm',
  target: 'node22',
  dts: false,
  clean: true,
  outExtensions: () => ({ js: '.js' }),
})
