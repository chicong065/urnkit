export const CHAR_NID_BODY = 1 << 0
export const CHAR_UNRESERVED = 1 << 1
export const CHAR_SUB_DELIMS = 1 << 2
export const CHAR_NSS_BODY = 1 << 3
export const CHAR_COMP_BODY = 1 << 4
export const CHAR_HEX = 1 << 5

export const CHAR_CLASS_TABLE = (() => {
  const table = new Uint8Array(256)
  for (let codePoint = 0; codePoint < 256; codePoint++) {
    let flags = 0
    const isDigit = codePoint >= 0x30 && codePoint <= 0x39
    const isUpperAlpha = codePoint >= 0x41 && codePoint <= 0x5a
    const isLowerAlpha = codePoint >= 0x61 && codePoint <= 0x7a
    const isAlpha = isUpperAlpha || isLowerAlpha
    const isAlphanum = isAlpha || isDigit
    const isHyphen = codePoint === 0x2d

    if (isAlphanum || isHyphen) {
      flags |= CHAR_NID_BODY
    }

    // unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
    if (isAlphanum || codePoint === 0x2d || codePoint === 0x2e || codePoint === 0x5f || codePoint === 0x7e) {
      flags |= CHAR_UNRESERVED
    }

    // sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
    if (
      codePoint === 0x21 ||
      codePoint === 0x24 ||
      codePoint === 0x26 ||
      codePoint === 0x27 ||
      codePoint === 0x28 ||
      codePoint === 0x29 ||
      codePoint === 0x2a ||
      codePoint === 0x2b ||
      codePoint === 0x2c ||
      codePoint === 0x3b ||
      codePoint === 0x3d
    ) {
      flags |= CHAR_SUB_DELIMS
    }

    // hex digit = DIGIT / "A"-"F" / "a"-"f"
    if (isDigit || (codePoint >= 0x41 && codePoint <= 0x46) || (codePoint >= 0x61 && codePoint <= 0x66)) {
      flags |= CHAR_HEX
    }

    // NSS body = unreserved / sub-delims / ":" / "@" / "/"
    // '%' is excluded; percent triplets are validated separately by the scanner.
    if (
      flags & CHAR_UNRESERVED ||
      flags & CHAR_SUB_DELIMS ||
      codePoint === 0x3a ||
      codePoint === 0x40 ||
      codePoint === 0x2f
    ) {
      flags |= CHAR_NSS_BODY
    }

    // comp body = NSS body / "?"
    if (flags & CHAR_NSS_BODY || codePoint === 0x3f) {
      flags |= CHAR_COMP_BODY
    }

    table[codePoint] = flags
  }
  return table
})()

const HEX_DIGITS = '0123456789ABCDEF'
const TEXT_ENCODER = new TextEncoder()

/**
 * Percent-encodes an arbitrary string for use as URN NSS or component
 * content. Leaves bytes in the unreserved set (`A-Z` `a-z` `0-9` `-` `.` `_`
 * `~`) verbatim and percent-encodes everything else as `%HH` triplets with
 * uppercase hex digits. UTF-8 multibyte sequences are encoded byte-by-byte
 * (`é` → `%C3%A9`).
 *
 * Use this when building NSS values from raw user input before passing the
 * `Urn` to `serialize`. `serialize` itself is strict and does not auto-encode.
 *
 * @param text - Arbitrary string to encode.
 * @returns Percent-encoded string with uppercase hex digits.
 *
 * @example
 * percentEncode("hello world"); // "hello%20world"
 * percentEncode("a/b?c#d");     // "a%2Fb%3Fc%23d"
 * percentEncode("café");        // "caf%C3%A9"
 *
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-2.3
 */
export function percentEncode(text: string): string {
  if (text.length === 0) {
    return ''
  }
  const outputParts: string[] = []
  for (const byte of TEXT_ENCODER.encode(text)) {
    if ((CHAR_CLASS_TABLE[byte] ?? 0) & CHAR_UNRESERVED) {
      outputParts.push(String.fromCharCode(byte))
    } else {
      outputParts.push(`%${HEX_DIGITS.charAt(byte >> 4)}${HEX_DIGITS.charAt(byte & 0x0f)}`)
    }
  }
  return outputParts.join('')
}
