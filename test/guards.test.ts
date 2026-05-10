import { describe, expect, test } from 'vitest'

import { isUrn } from '@/guards.ts'

describe('isUrn', () => {
  test('returns true for a minimal valid Urn', () => {
    expect(isUrn({ nid: 'example', nss: 'foo' })).toBe(true)
  })

  test('returns true for a Urn with all components', () => {
    expect(
      isUrn({
        nid: 'example',
        nss: 'foo',
        rComponent: 'r',
        qComponent: 'q',
        fComponent: 'f',
      })
    ).toBe(true)
  })

  test('returns false for null and undefined', () => {
    expect(isUrn(null)).toBe(false)
    expect(isUrn(undefined)).toBe(false)
  })

  test('returns false for primitives', () => {
    expect(isUrn('urn:example:foo')).toBe(false)
    expect(isUrn(42)).toBe(false)
    expect(isUrn(true)).toBe(false)
  })

  test('returns false for arrays', () => {
    expect(isUrn([])).toBe(false)
  })

  test('returns false when nid is missing', () => {
    expect(isUrn({ nss: 'foo' })).toBe(false)
  })

  test('returns false when nss is missing', () => {
    expect(isUrn({ nid: 'example' })).toBe(false)
  })

  test('returns false when nid would fail validation', () => {
    expect(isUrn({ nid: '', nss: 'foo' })).toBe(false)
    expect(isUrn({ nid: 'urn', nss: 'foo' })).toBe(false)
  })

  test('returns false when nss would fail validation', () => {
    expect(isUrn({ nid: 'example', nss: '' })).toBe(false)
    expect(isUrn({ nid: 'example', nss: 'café' })).toBe(false)
  })

  test('returns false when a component has wrong type', () => {
    expect(isUrn({ nid: 'example', nss: 'foo', rComponent: 42 })).toBe(false)
  })
})
