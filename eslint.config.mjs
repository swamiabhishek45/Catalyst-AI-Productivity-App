import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'drizzle/**',
    'tsconfig.tsbuildinfo',
    'tsconfig.json',
    'package-lock.json',
    'postcss.config.mjs',
    'components.json',
  ]),
]);
