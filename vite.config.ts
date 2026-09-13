import { readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Everything the app loads is same-origin: the Whisper model lives in
// public/models/, the ONNX runtime wasm in public/ort/, and there are no
// third-party scripts. Lock that down with a CSP so a regression can't
// quietly start talking to another host. Injected at build time only —
// in dev it would block Vite's HMR websocket and client.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' is required to compile the onnxruntime wasm.
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const meta = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`
        return html.replace('<head>', `<head>\n    ${meta}`)
      },
    },
  }
}

// Bundling @huggingface/transformers pulls in onnxruntime-web's wasm glue,
// which contains `new URL('ort-wasm-...asyncify.wasm', import.meta.url)`.
// Vite turns that into an emitted ~23 MB asset. It's dead weight: the
// glue only reads that URL when `wasm.wasmPaths` is unset, and
// whisperTranscriber.ts always pins wasmPaths to public/ort/. Strip it
// from the bundle before it's written (and sweep assets/ as a fallback
// in case the rolldown backend writes it anyway).
function dropBundledOrtWasm(): Plugin {
  const isDead = (name: string) => /(^|\/)ort-wasm[^/]*\.wasm$/.test(name)
  let assetsDir = ''
  return {
    name: 'drop-bundled-ort-wasm',
    apply: 'build',
    configResolved(config) {
      assetsDir = resolve(config.root, config.build.outDir, config.build.assetsDir)
    },
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (isDead(fileName)) delete bundle[fileName]
      }
    },
    closeBundle() {
      try {
        for (const entry of readdirSync(assetsDir)) {
          if (isDead(entry)) rmSync(resolve(assetsDir, entry))
        }
      } catch {
        /* assets/ may not exist or already be clean */
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentSecurityPolicy(), dropBundledOrtWasm()],
  base: '/interview-trainer/',
  build: {
    // Avoid Vite's inline module-preload polyfill script so script-src can
    // stay 'self' with no inline allowance.
    modulePreload: { polyfill: false },
  },
  optimizeDeps: {
    // Heavy and node-flavoured; only ever pulled in via dynamic import().
    exclude: ['@huggingface/transformers'],
  },
})
