/**
 * Node module-resolution hook so a plain `node` test can import pure app
 * modules from `src/` exactly as Next resolves them:
 *   • `@/x/y`        → `<repo>/src/x/y`
 *   • extensionless  → tries `.js`, then `/index.js`
 *
 * Register with:  node --import ./scripts/lib/app-alias-loader.mjs <test>
 * Only for modules with no `server-only` / database imports.
 */
import { register } from 'node:module'

register(
  `data:text/javascript,${encodeURIComponent(`
    const SRC = ${JSON.stringify(new URL('../../src/', import.meta.url).href)}
    export async function resolve(specifier, context, next) {
      const target = specifier.startsWith('@/') ? SRC + specifier.slice(2) : specifier
      try {
        return await next(target, context)
      } catch (error) {
        if (error?.code !== 'ERR_MODULE_NOT_FOUND' && error?.code !== 'ERR_UNSUPPORTED_DIR_IMPORT') throw error
        for (const suffix of ['.js', '/index.js']) {
          try { return await next(target + suffix, context) } catch {}
        }
        throw error
      }
    }
  `)}`,
  import.meta.url
)
