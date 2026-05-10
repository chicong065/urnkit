import { describe, expect, test } from 'vitest'

import { equals, normalize, parse, serialize } from '@/index.ts'

describe('RFC 8141 — examples from Section 2 (Syntax)', () => {
  // Examples drawn from RFC 8141 body and Appendix A
  const examples: Array<{ input: string; nid: string; nss: string }> = [
    { input: 'urn:example:a123,z456', nid: 'example', nss: 'a123,z456' },
    { input: 'URN:example:a123,z456', nid: 'example', nss: 'a123,z456' },
    { input: 'urn:EXAMPLE:a123,z456', nid: 'example', nss: 'a123,z456' },
    { input: 'urn:example:a123,z456?+abc', nid: 'example', nss: 'a123,z456' },
    { input: 'urn:example:a123,z456?=xyz', nid: 'example', nss: 'a123,z456' },
    { input: 'urn:example:a123,z456#789', nid: 'example', nss: 'a123,z456' },
  ]

  for (const example of examples) {
    test(`parses "${example.input}"`, () => {
      const urn = parse(example.input)
      expect(urn.nid).toBe(example.nid)
      expect(urn.nss).toBe(example.nss)
    })
  }
})

describe('RFC 8141 — Section 3 lexical equivalence examples', () => {
  test('scheme is case-insensitive', () => {
    expect(equals(parse('URN:example:foo'), parse('urn:example:foo'))).toBe(true)
  })

  test('NID is case-insensitive', () => {
    expect(equals(parse('urn:Example:foo'), parse('urn:example:foo'))).toBe(true)
  })

  test('NSS is case-sensitive', () => {
    expect(equals(parse('urn:example:Foo'), parse('urn:example:foo'))).toBe(false)
  })

  test('percent-encoded unreserved chars decode to their literal form', () => {
    expect(equals(parse('urn:example:%41'), parse('urn:example:A'))).toBe(true)
  })

  test('percent-encoding hex digits compare case-insensitively', () => {
    expect(equals(parse('urn:example:%2f'), parse('urn:example:%2F'))).toBe(true)
  })

  test('r/q/f components do not affect equivalence', () => {
    expect(equals(parse('urn:example:foo?+r1?=q1#f1'), parse('urn:example:foo?+r2?=q2#f2'))).toBe(true)
  })
})

describe('RFC 8141 — round-trip on RFC examples', () => {
  const samples = [
    'urn:example:a123,z456',
    'urn:isbn:0451450523',
    'urn:oid:2.16.840',
    'urn:example:foo?+r1',
    'urn:example:foo?=q1',
    'urn:example:foo#f1',
    'urn:example:foo?+r1?=q1#f1',
  ]

  for (const sample of samples) {
    test(`serialize(parse("${sample}")) === "${sample}"`, () => {
      expect(serialize(parse(sample))).toBe(sample)
    })
  }
})

describe('RFC 8141 — IANA-registered NIDs (real-world corpus)', () => {
  const realUrns = [
    'urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    'urn:isbn:9780321765723',
    'urn:oid:1.3.6.1.4.1.343',
    'urn:nbn:de:bvb:19-146642',
    'urn:iso:std:iso:9999:-1:ed-2',
    'urn:ietf:rfc:2648',
  ]

  for (const realUrn of realUrns) {
    test(`parses "${realUrn}"`, () => {
      const urn = parse(realUrn)
      expect(urn.nid.length).toBeGreaterThan(0)
      expect(urn.nss.length).toBeGreaterThan(0)
    })
  }
})

describe('RFC 8141 — normalize idempotence', () => {
  const samples = ['urn:example:%41%42%43', 'urn:example:a%2fb%2Fc', 'urn:example:%7E%7e']
  for (const sample of samples) {
    test(`normalize is idempotent for "${sample}"`, () => {
      const once = normalize(parse(sample))
      const twice = normalize(once)
      expect(twice).toEqual(once)
    })
  }
})
