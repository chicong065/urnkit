import { describe, expect, test } from 'vitest'

import { UrnParseError } from '@/errors.ts'
import { safeParse } from '@/parse.ts'

describe('safeParse', () => {
  test('returns ok=true with the parsed Urn for valid input', () => {
    const result = safeParse('urn:example:foo')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.nid).toBe('example')
      expect(result.value.nss).toBe('foo')
    }
  })

  test('returns ok=false with UrnParseError for invalid input', () => {
    const result = safeParse('not-a-urn')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(UrnParseError)
      expect(result.error.code).toBe('INVALID_SCHEME')
    }
  })

  test('never throws for empty string', () => {
    expect(() => safeParse('')).not.toThrow()
    const result = safeParse('')
    expect(result.ok).toBe(false)
  })

  test('error code matches what parse() would throw', () => {
    const result = safeParse('urn:urn:foo')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_NID')
    }
  })
})
