import { describe, expect, test } from 'vitest'

import { canonicalNss, normalize } from '@/normalize.ts'
import type { Urn } from '@/types.ts'

describe('canonicalNss', () => {
  test('uppercases hex digits in percent triplets', () => {
    expect(canonicalNss('a%2fb')).toBe('a%2Fb')
    expect(canonicalNss('%aa%BB%cc')).toBe('%AA%BB%CC')
  })

  test('decodes percent triplets that represent unreserved chars', () => {
    expect(canonicalNss('%41%42%43')).toBe('ABC')
    expect(canonicalNss('%7E')).toBe('~')
    expect(canonicalNss('%2D%2E%5F%7E')).toBe('-._~')
  })

  test('leaves non-unreserved percent triplets encoded but uppercased', () => {
    expect(canonicalNss('%20')).toBe('%20')
    expect(canonicalNss('%2f')).toBe('%2F')
  })

  test('leaves literal unreserved chars untouched', () => {
    expect(canonicalNss('abc-._~')).toBe('abc-._~')
  })

  test('handles mixed input', () => {
    expect(canonicalNss('a%41b%2fc')).toBe('aAb%2Fc')
  })

  test('returns empty string for empty input', () => {
    expect(canonicalNss('')).toBe('')
  })
})

describe('normalize', () => {
  test('returns a new frozen object with canonical NSS', () => {
    const original: Urn = { nid: 'example', nss: '%41%2f' }
    const normalized = normalize(original)
    expect(normalized.nss).toBe('A%2F')
    expect(normalized.nid).toBe('example')
    expect(Object.isFrozen(normalized)).toBe(true)
  })

  test('preserves r, q, f components untouched', () => {
    const original: Urn = {
      nid: 'example',
      nss: '%41',
      rComponent: 'r%2f',
      qComponent: 'q%41',
      fComponent: 'f%2f',
    }
    const normalized = normalize(original)
    expect(normalized.nss).toBe('A')
    expect(normalized.rComponent).toBe('r%2f')
    expect(normalized.qComponent).toBe('q%41')
    expect(normalized.fComponent).toBe('f%2f')
  })

  test('is idempotent', () => {
    const original: Urn = { nid: 'example', nss: '%41%2f%aa' }
    const once = normalize(original)
    const twice = normalize(once)
    expect(twice).toEqual(once)
  })
})
