import { bench, describe } from 'vitest'

import { parse } from '@/index.ts'

const SAMPLES = [
  'urn:example:foo',
  'urn:isbn:9780321765723',
  'urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
  'urn:example:a%20b%2Fc?+r1?=q1#f1',
  'urn:nbn:de:bvb:19-146642',
]

describe('parse throughput', () => {
  bench('parse short URN', () => {
    parse(SAMPLES[0]!)
  })

  bench('parse ISBN URN', () => {
    parse(SAMPLES[1]!)
  })

  bench('parse UUID URN', () => {
    parse(SAMPLES[2]!)
  })

  bench('parse URN with all components', () => {
    parse(SAMPLES[3]!)
  })

  bench('parse mixed corpus (5 URNs)', () => {
    for (const sample of SAMPLES) {
      parse(sample)
    }
  })
})
