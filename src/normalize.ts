import { CHAR_CLASS_TABLE, CHAR_UNRESERVED } from '@/encode.ts'
import type { Urn } from '@/types.ts'

const PERCENT = 0x25

const HEX_VALUES: Record<number, number> = (() => {
  const table: Record<number, number> = {}
  for (let digit = 0; digit <= 9; digit++) {
    table[0x30 + digit] = digit
  }
  for (let letter = 0; letter < 6; letter++) {
    table[0x41 + letter] = 10 + letter
    table[0x61 + letter] = 10 + letter
  }
  return table
})()

const HEX_DIGITS = '0123456789ABCDEF'

export function canonicalNss(nss: string): string {
  if (nss.length === 0) {
    return ''
  }
  const parts: string[] = []
  let charIndex = 0
  while (charIndex < nss.length) {
    // Bare byte, or a trailing '%' with no room for a triplet: pass through.
    if (nss.charCodeAt(charIndex) !== PERCENT || charIndex + 2 >= nss.length) {
      parts.push(nss.charAt(charIndex))
      charIndex++
      continue
    }
    // Possible triplet: parse the two bytes after '%' as hex.
    const high = HEX_VALUES[nss.charCodeAt(charIndex + 1)]
    const low = HEX_VALUES[nss.charCodeAt(charIndex + 2)]
    if (high === undefined || low === undefined) {
      // Either follow-up byte is not a hex digit: emit '%' alone, advance one byte.
      parts.push('%')
      charIndex++
      continue
    }
    // Valid triplet: decode unreserved bytes to their literal form;
    // uppercase the hex digits of every other triplet.
    const decoded = (high << 4) | low
    if ((CHAR_CLASS_TABLE[decoded] ?? 0) & CHAR_UNRESERVED) {
      parts.push(String.fromCharCode(decoded))
    } else {
      parts.push(`%${HEX_DIGITS.charAt(high)}${HEX_DIGITS.charAt(low)}`)
    }
    charIndex += 3
  }
  return parts.join('')
}

/**
 * Returns a new frozen `Urn` whose NSS is canonicalised: percent-encoded
 * unreserved characters are decoded to their literal form (`%41` → `A`), and
 * the hex digits in remaining triplets are uppercased (`%2f` → `%2F`). Other
 * fields (NID, r/q/f components) are copied through unchanged.
 *
 * Useful for using URNs as map or cache keys where two equivalent inputs
 * should hash to the same value. For boolean equivalence checks, use `equals`
 * directly — it canonicalises NSS internally.
 *
 * @param urn - URN to normalize.
 * @returns A new frozen `Urn` with canonical NSS. Idempotent.
 *
 * @example
 * normalize(parse("urn:example:%41bc")).nss; // "Abc"
 * normalize(parse("urn:example:a%2fb")).nss; // "a%2Fb"
 *
 * @see https://www.rfc-editor.org/rfc/rfc8141#section-3
 */
export function normalize(urn: Urn): Urn {
  return Object.freeze({ ...urn, nss: canonicalNss(urn.nss) })
}
