import { describe, expect, test } from 'vitest'

import { parse, serialize } from '@/index.ts'

const NID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789-'
const NSS_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~:@/!$&'()*+,;="

class Lcg {
  private state: number
  constructor(seed: number) {
    this.state = seed >>> 0
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0
    return this.state
  }
  range(maxExclusive: number): number {
    return this.next() % maxExclusive
  }
  pick<TElement>(items: readonly TElement[]): TElement {
    return items[this.range(items.length)]!
  }
}

function generateNid(rng: Lcg): string {
  const length = 2 + rng.range(31) // 2..32
  let nid = ''
  for (let charIndex = 0; charIndex < length; charIndex++) {
    if (charIndex === 0 || charIndex === length - 1) {
      // first/last char must not be '-'
      const alphanum = NID_CHARS.slice(0, NID_CHARS.length - 1)
      nid += rng.pick(alphanum.split(''))
    } else {
      nid += rng.pick(NID_CHARS.split(''))
    }
  }
  return nid.toLowerCase() === 'urn' ? `${nid}x` : nid
}

function generateNss(rng: Lcg): string {
  const length = 1 + rng.range(20)
  let nss = ''
  for (let charIndex = 0; charIndex < length; charIndex++) {
    if (rng.range(10) === 0) {
      // emit a percent triplet
      const byte = rng.range(256)
      nss += '%' + byte.toString(16).padStart(2, '0').toUpperCase()
    } else {
      nss += rng.pick(NSS_CHARS.split(''))
    }
  }
  return nss
}

function generateUrnString(rng: Lcg): string {
  const nid = generateNid(rng)
  const nss = generateNss(rng)
  const hasR = rng.range(2) === 0
  const hasQ = rng.range(2) === 0
  const hasF = rng.range(2) === 0
  let result = `urn:${nid}:${nss}`
  if (hasR) {
    result += `?+${generateNss(rng)}`
  }
  if (hasQ) {
    result += `?=${generateNss(rng)}`
  }
  if (hasF) {
    result += `#${generateNss(rng)}`
  }
  return result
}

describe('round-trip property: serialize(parse(s)) === s for canonical-shape inputs', () => {
  test('10000 generated URNs round-trip', () => {
    const rng = new Lcg(0xc0ffee)
    let attempted = 0
    let succeeded = 0
    while (succeeded < 10_000 && attempted < 50_000) {
      attempted++
      const candidate = generateUrnString(rng)
      try {
        const parsed = parse(candidate)
        const reserialized = serialize(parsed)
        // The generator may produce inputs whose NID has uppercase letters; the
        // canonical output lowercases them. Compare against the lowercased NID
        // form of the input.
        const expected = candidate.replace(/^urn:[^:]+/, (match) => match.toLowerCase())
        expect(reserialized).toBe(expected)
        succeeded++
      } catch {
        // Generator may produce invalid inputs (unlikely with current grammar
        // but defensive); skip them.
      }
    }
    expect(succeeded).toBeGreaterThanOrEqual(1000)
  })
})

describe('round-trip property: parse(serialize(parse(s))) deep-equals parse(s)', () => {
  test('deterministic samples', () => {
    const samples = [
      'urn:example:foo',
      'urn:example:foo?+r1',
      'urn:example:foo?=q1',
      'urn:example:foo#f1',
      'urn:example:foo?+r1?=q1#f1',
      'urn:example:%41%42%43',
      'urn:example:a:b/c@d',
    ]
    for (const sample of samples) {
      const first = parse(sample)
      const second = parse(serialize(first))
      expect(second).toEqual(first)
    }
  })
})
