import { describe, expect, test } from 'vitest'

import { CHAR_CLASS_TABLE, CHAR_HEX, CHAR_NID_BODY, CHAR_NSS_BODY, CHAR_UNRESERVED, percentEncode } from '@/encode.ts'

describe('CHAR_CLASS_TABLE', () => {
  test('classifies digits as NID body, unreserved, NSS body, hex', () => {
    const flags = CHAR_CLASS_TABLE[0x30]! // '0'
    expect(flags & CHAR_NID_BODY).toBeGreaterThan(0)
    expect(flags & CHAR_UNRESERVED).toBeGreaterThan(0)
    expect(flags & CHAR_NSS_BODY).toBeGreaterThan(0)
    expect(flags & CHAR_HEX).toBeGreaterThan(0)
  })

  test('classifies hyphen as NID body but not as hex', () => {
    const flags = CHAR_CLASS_TABLE[0x2d]! // '-'
    expect(flags & CHAR_NID_BODY).toBeGreaterThan(0)
    expect(flags & CHAR_HEX).toBe(0)
  })

  test("classifies '%' as NOT NSS body (handled separately by scanner)", () => {
    const flags = CHAR_CLASS_TABLE[0x25]! // '%'
    expect(flags & CHAR_NSS_BODY).toBe(0)
  })

  test("classifies '?' as NOT NSS body but as comp body", () => {
    const flags = CHAR_CLASS_TABLE[0x3f]! // '?'
    expect(flags & CHAR_NSS_BODY).toBe(0)
  })

  test('classifies non-ASCII as zero', () => {
    expect(CHAR_CLASS_TABLE[0x80]).toBe(0)
    expect(CHAR_CLASS_TABLE[0xff]).toBe(0)
  })

  test('classifies NUL, space, and DEL as zero', () => {
    expect(CHAR_CLASS_TABLE[0x00]).toBe(0)
    expect(CHAR_CLASS_TABLE[0x20]).toBe(0)
    expect(CHAR_CLASS_TABLE[0x7f]).toBe(0)
  })

  test('classifies hex letters case-insensitively', () => {
    expect(CHAR_CLASS_TABLE[0x41]! & CHAR_HEX).toBeGreaterThan(0) // 'A'
    expect(CHAR_CLASS_TABLE[0x61]! & CHAR_HEX).toBeGreaterThan(0) // 'a'
    expect(CHAR_CLASS_TABLE[0x47]! & CHAR_HEX).toBe(0) // 'G'
  })
})

describe('percentEncode', () => {
  test('leaves unreserved chars untouched', () => {
    expect(percentEncode('abcXYZ012-._~')).toBe('abcXYZ012-._~')
  })

  test('encodes reserved ASCII', () => {
    expect(percentEncode('a b')).toBe('a%20b')
    expect(percentEncode('a/b?c#d')).toBe('a%2Fb%3Fc%23d')
  })

  test('encodes UTF-8 multibyte chars', () => {
    expect(percentEncode('é')).toBe('%C3%A9')
    expect(percentEncode('中')).toBe('%E4%B8%AD')
  })

  test('encodes 4-byte UTF-8 (surrogate pair)', () => {
    expect(percentEncode('🌍')).toBe('%F0%9F%8C%8D')
  })

  test('encodes ASCII control bytes', () => {
    expect(percentEncode('\x00\x1f')).toBe('%00%1F')
  })

  test('uppercases hex digits', () => {
    expect(percentEncode('\xab')).toBe('%C2%AB')
  })

  test('returns empty string for empty input', () => {
    expect(percentEncode('')).toBe('')
  })
})
