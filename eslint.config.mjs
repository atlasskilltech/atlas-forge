import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

/**
 * eslint-config-next v16 ships native flat config, so no eslintrc compat layer.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: ['.next/**', 'node_modules/**', 'reference/**', 'public/**'],
  },
]

export default eslintConfig
