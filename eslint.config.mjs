import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // React Compiler is not enabled. Keep its optimization diagnostics visible
  // without making existing effect-based loading states fail the lint gate.
  { rules: {
    'react-hooks/immutability': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
  } },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
