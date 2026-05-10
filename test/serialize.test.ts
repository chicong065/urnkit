import { describe, expect, test } from 'vitest'

import { UrnSerializeError } from '@/errors.ts'
import { serialize } from '@/serialize.ts'

describe('serialize — happy path', () => {
  test('serializes minimal URN', () => {
    expect(serialize({ nid: 'example', nss: 'foo' })).toBe('urn:example:foo')
  })

  test('serializes with r-component', () => {
    expect(serialize({ nid: 'example', nss: 'foo', rComponent: 'r1' })).toBe('urn:example:foo?+r1')
  })

  test('serializes with q-component', () => {
    expect(serialize({ nid: 'example', nss: 'foo', qComponent: 'k=v' })).toBe('urn:example:foo?=k=v')
  })

  test('serializes with f-component', () => {
    expect(serialize({ nid: 'example', nss: 'foo', fComponent: 'frag' })).toBe('urn:example:foo#frag')
  })

  test('serializes with all three components', () => {
    expect(
      serialize({
        nid: 'example',
        nss: 'foo',
        rComponent: 'r1',
        qComponent: 'q1',
        fComponent: 'f1',
      })
    ).toBe('urn:example:foo?+r1?=q1#f1')
  })

  test('preserves percent-encoded NSS', () => {
    expect(serialize({ nid: 'example', nss: 'a%20b' })).toBe('urn:example:a%20b')
  })

  test('lowercases NID on output', () => {
    expect(serialize({ nid: 'EXAMPLE', nss: 'foo' })).toBe('urn:example:foo')
  })
})

describe('serialize — strict validation', () => {
  test('throws on empty NID', () => {
    expect(() => serialize({ nid: '', nss: 'foo' })).toThrow(UrnSerializeError)
  })

  test("throws on NID 'urn'", () => {
    expect(() => serialize({ nid: 'urn', nss: 'foo' })).toThrow(/INVALID_NID/)
  })

  test('throws on NID with invalid char', () => {
    expect(() => serialize({ nid: 'ex.ample', nss: 'foo' })).toThrow(/INVALID_NID/)
  })

  test('throws on NID starting/ending with hyphen', () => {
    expect(() => serialize({ nid: '-ex', nss: 'foo' })).toThrow(/INVALID_NID/)
    expect(() => serialize({ nid: 'ex-', nss: 'foo' })).toThrow(/INVALID_NID/)
  })

  test('throws on empty NSS', () => {
    expect(() => serialize({ nid: 'example', nss: '' })).toThrow(/EMPTY_NSS/)
  })

  test("throws on raw '?' in NSS", () => {
    expect(() => serialize({ nid: 'example', nss: 'a?b' })).toThrow(/INVALID_NSS_CHAR/)
  })

  test("throws on raw '#' in NSS", () => {
    expect(() => serialize({ nid: 'example', nss: 'a#b' })).toThrow(/INVALID_NSS_CHAR/)
  })

  test('throws on bad percent-encoding in NSS', () => {
    expect(() => serialize({ nid: 'example', nss: 'a%2Gb' })).toThrow(/INVALID_PERCENT_ENCODING/)
    expect(() => serialize({ nid: 'example', nss: 'a%' })).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test('throws on raw non-ASCII in NSS', () => {
    expect(() => serialize({ nid: 'example', nss: 'café' })).toThrow(/INVALID_NSS_CHAR/)
  })

  test('throws on bad percent-encoding in r-component', () => {
    expect(() => serialize({ nid: 'example', nss: 'x', rComponent: '%ZZ' })).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test('error reports correct field', () => {
    try {
      serialize({ nid: 'example', nss: 'x', qComponent: '%' })
      expect.fail('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(UrnSerializeError)
      if (error instanceof UrnSerializeError) {
        expect(error.field).toBe('qComponent')
      }
    }
  })
})
