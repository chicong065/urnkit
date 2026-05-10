import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUNDLE_BUDGET_BYTES = 3 * 1024 // 3 KB min+gz target

const repoRoot = resolve(import.meta.dirname, '..')
const esmPath = resolve(repoRoot, 'dist/index.js')

const rawSource = readFileSync(esmPath)
const rawSize = statSync(esmPath).size
const gzippedSize = gzipSync(rawSource, { level: 9 }).length

console.log(`ESM raw:     ${rawSize.toString().padStart(6)} bytes`)
console.log(`ESM gzipped: ${gzippedSize.toString().padStart(6)} bytes`)
console.log(`Budget:      ${BUNDLE_BUDGET_BYTES.toString().padStart(6)} bytes (gzipped)`)

if (gzippedSize > BUNDLE_BUDGET_BYTES) {
  console.error(`Bundle exceeds budget by ${gzippedSize - BUNDLE_BUDGET_BYTES} bytes`)
  process.exit(1)
}
console.log('Bundle within budget.')
