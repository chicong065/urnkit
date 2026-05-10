import { describe, expect, test } from 'vitest'

import { equals } from '@/equals.ts'
import { parse } from '@/parse.ts'

describe('equals — RFC 8141 Section 3 lexical equivalence', () => {
  test('reflexive', () => {
    const urn = parse('urn:example:foo')
    expect(equals(urn, urn)).toBe(true)
  })

  test("ignores 'urn' scheme casing (handled at parse time, both lowercased)", () => {
    expect(equals(parse('URN:example:foo'), parse('urn:example:foo'))).toBe(true)
  })

  test('ignores NID casing', () => {
    expect(equals(parse('urn:Example:foo'), parse('urn:eXAMPLE:foo'))).toBe(true)
  })

  test('treats NSS as case-sensitive', () => {
    expect(equals(parse('urn:example:Foo'), parse('urn:example:foo'))).toBe(false)
  })

  test('normalizes percent-encoding case in NSS', () => {
    expect(equals(parse('urn:example:a%2fb'), parse('urn:example:a%2Fb'))).toBe(true)
  })

  test('decodes percent-encoded unreserved chars in NSS', () => {
    expect(equals(parse('urn:example:%41bc'), parse('urn:example:Abc'))).toBe(true)
  })

  test('ignores r-component differences', () => {
    expect(equals(parse('urn:example:foo?+r1'), parse('urn:example:foo?+r2'))).toBe(true)
  })

  test('ignores q-component differences', () => {
    expect(equals(parse('urn:example:foo?=a=b'), parse('urn:example:foo?=c=d'))).toBe(true)
  })

  test('ignores f-component differences', () => {
    expect(equals(parse('urn:example:foo#a'), parse('urn:example:foo#b'))).toBe(true)
  })

  test('returns false for different NIDs', () => {
    expect(equals(parse('urn:foo:x1'), parse('urn:bar:x1'))).toBe(false)
  })

  test('returns false for different NSS values', () => {
    expect(equals(parse('urn:example:abc'), parse('urn:example:xyz'))).toBe(false)
  })
})
