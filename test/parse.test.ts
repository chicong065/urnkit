import { describe, expect, test } from 'vitest'

import { UrnParseError } from '@/errors.ts'
import { parse } from '@/parse.ts'

describe('parse — scheme', () => {
  test('rejects empty string', () => {
    expect(() => parse('')).toThrow(UrnParseError)
  })

  test("rejects missing 'urn:' prefix", () => {
    expect(() => parse('foo:bar:baz')).toThrow(/INVALID_SCHEME/)
  })

  test("accepts case-insensitive 'URN:'", () => {
    const urn = parse('URN:example:foo')
    expect(urn.nid).toBe('example')
    expect(urn.nss).toBe('foo')
  })

  test("accepts mixed-case 'Urn:'", () => {
    const urn = parse('Urn:example:foo')
    expect(urn.nid).toBe('example')
  })
})

describe('parse — NID', () => {
  test('lowercases NID', () => {
    const urn = parse('urn:EXAMPLE:foo')
    expect(urn.nid).toBe('example')
  })

  test('rejects NID shorter than 2 chars', () => {
    expect(() => parse('urn:a:foo')).toThrow(/INVALID_NID/)
  })

  test('rejects NID longer than 32 chars', () => {
    const longNid = 'a'.repeat(33)
    expect(() => parse(`urn:${longNid}:foo`)).toThrow(/INVALID_NID/)
  })

  test('accepts NID of exactly 2 chars', () => {
    expect(parse('urn:ab:foo').nid).toBe('ab')
  })

  test('accepts NID of exactly 32 chars', () => {
    const longNid = 'a'.repeat(32)
    expect(parse(`urn:${longNid}:foo`).nid).toBe(longNid)
  })

  test('rejects NID starting with hyphen', () => {
    expect(() => parse('urn:-ab:foo')).toThrow(/INVALID_NID/)
  })

  test('rejects NID ending with hyphen', () => {
    expect(() => parse('urn:ab-:foo')).toThrow(/INVALID_NID/)
  })

  test('accepts NID with internal hyphens', () => {
    expect(parse('urn:a-b-c:foo').nid).toBe('a-b-c')
  })

  test('rejects NID with non-alphanumeric chars', () => {
    expect(() => parse('urn:a_b:foo')).toThrow(/INVALID_NID/)
    expect(() => parse('urn:a.b:foo')).toThrow(/INVALID_NID/)
  })

  test("rejects literal NID 'urn'", () => {
    expect(() => parse('urn:urn:foo')).toThrow(/INVALID_NID/)
    expect(() => parse('urn:URN:foo')).toThrow(/INVALID_NID/)
  })

  test("rejects missing ':' after NID", () => {
    expect(() => parse('urn:example')).toThrow(/INVALID_NID/)
  })

  test('rejects empty NID with a clear message', () => {
    expect(() => parse('urn:')).toThrow(/INVALID_NID: NID is empty/)
  })

  test('trailing-hyphen error reports the trailing hyphen position', () => {
    try {
      parse('urn:ab-:foo')
      expect.fail('expected parse to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(UrnParseError)
      if (error instanceof UrnParseError) {
        expect(error.code).toBe('INVALID_NID')
        // Trailing hyphen is at index 6 ("urn:ab-".length - 1).
        expect(error.position).toBe(6)
      }
    }
  })

  test('accepts mixed-case NID with internal hyphens', () => {
    expect(parse('urn:A-B-c:foo').nid).toBe('a-b-c')
  })
})

describe('parse — NSS', () => {
  test('rejects empty NSS', () => {
    expect(() => parse('urn:example:')).toThrow(/EMPTY_NSS/)
  })

  test('accepts simple alphanumeric NSS', () => {
    expect(parse('urn:example:foo123').nss).toBe('foo123')
  })

  test('accepts NSS with allowed punctuation', () => {
    expect(parse('urn:example:a:b/c@d').nss).toBe('a:b/c@d')
  })

  test('accepts sub-delims in NSS', () => {
    expect(parse("urn:example:a!b$c&d'e(f)g*h+i,j;k=l").nss).toBe("a!b$c&d'e(f)g*h+i,j;k=l")
  })

  test('accepts valid percent triplets in NSS', () => {
    expect(parse('urn:example:a%20b').nss).toBe('a%20b')
    expect(parse('urn:example:%2F%2f').nss).toBe('%2F%2f')
  })

  test("rejects bare '%' at end of NSS", () => {
    expect(() => parse('urn:example:foo%')).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test("rejects '%' followed by 1 hex digit", () => {
    expect(() => parse('urn:example:foo%2')).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test("rejects '%' followed by non-hex", () => {
    expect(() => parse('urn:example:foo%2G')).toThrow(/INVALID_PERCENT_ENCODING/)
    expect(() => parse('urn:example:foo%GH')).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test('rejects raw non-ASCII in NSS', () => {
    expect(() => parse('urn:example:café')).toThrow(/INVALID_NSS_CHAR/)
  })

  test('rejects raw control chars in NSS', () => {
    expect(() => parse('urn:example:foo\x01bar')).toThrow(/INVALID_NSS_CHAR/)
  })
})

describe('parse — components', () => {
  test('parses r-component', () => {
    const urn = parse('urn:example:foo?+rdata')
    expect(urn.nss).toBe('foo')
    expect(urn.rComponent).toBe('rdata')
    expect(urn.qComponent).toBeUndefined()
    expect(urn.fComponent).toBeUndefined()
  })

  test('parses q-component', () => {
    const urn = parse('urn:example:foo?=key=value')
    expect(urn.qComponent).toBe('key=value')
    expect(urn.rComponent).toBeUndefined()
  })

  test('parses f-component', () => {
    const urn = parse('urn:example:foo#frag')
    expect(urn.fComponent).toBe('frag')
  })

  test('parses r and q together', () => {
    const urn = parse('urn:example:foo?+r1?=q1')
    expect(urn.rComponent).toBe('r1')
    expect(urn.qComponent).toBe('q1')
  })

  test('parses r, q, and f together', () => {
    const urn = parse('urn:example:foo?+r1?=q1#f1')
    expect(urn.rComponent).toBe('r1')
    expect(urn.qComponent).toBe('q1')
    expect(urn.fComponent).toBe('f1')
  })

  test('parses r and f together (no q)', () => {
    const urn = parse('urn:example:foo?+r1#f1')
    expect(urn.rComponent).toBe('r1')
    expect(urn.qComponent).toBeUndefined()
    expect(urn.fComponent).toBe('f1')
  })

  test('parses q and f together (no r)', () => {
    const urn = parse('urn:example:foo?=q1#f1')
    expect(urn.rComponent).toBeUndefined()
    expect(urn.qComponent).toBe('q1')
    expect(urn.fComponent).toBe('f1')
  })

  test("allows literal '?' inside r-component", () => {
    expect(parse('urn:example:foo?+a?b').rComponent).toBe('a?b')
  })

  test("rejects '?=' before '?+' (q before r)", () => {
    expect(() => parse('urn:example:foo?=q?+r')).toThrow(/INVALID_COMPONENT_/)
  })

  test("rejects two '?+' sequences", () => {
    expect(() => parse('urn:example:foo?+r1?+r2')).toThrow(/INVALID_COMPONENT_/)
  })

  test("rejects bare '?' after NSS", () => {
    expect(() => parse('urn:example:foo?bar')).toThrow(/INVALID_COMPONENT_ORDER/)
  })

  test('rejects invalid percent-encoding in r-component', () => {
    expect(() => parse('urn:example:foo?+a%2Gb')).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test('rejects invalid percent-encoding in q-component', () => {
    expect(() => parse('urn:example:foo?=a%Zb')).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test('rejects invalid percent-encoding in f-component', () => {
    expect(() => parse('urn:example:foo#a%Zb')).toThrow(/INVALID_PERCENT_ENCODING/)
  })

  test('accepts empty r-component', () => {
    expect(parse('urn:example:foo?+').rComponent).toBe('')
  })

  test('accepts empty q-component', () => {
    expect(parse('urn:example:foo?=').qComponent).toBe('')
  })

  test('accepts empty f-component', () => {
    expect(parse('urn:example:foo#').fComponent).toBe('')
  })

  test("f-component absorbs '?=' suffix as literal content", () => {
    const urn = parse('urn:example:foo#f1?=q1')
    expect(urn.fComponent).toBe('f1?=q1')
    expect(urn.qComponent).toBeUndefined()
  })

  test("f-component absorbs '?+' suffix as literal content", () => {
    const urn = parse('urn:example:foo#f1?+r1')
    expect(urn.fComponent).toBe('f1?+r1')
    expect(urn.rComponent).toBeUndefined()
  })

  test("accepts percent-encoded '#' inside r-component", () => {
    expect(parse('urn:example:foo?+a%23b').rComponent).toBe('a%23b')
  })
})
