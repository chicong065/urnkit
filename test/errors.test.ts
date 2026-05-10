import { describe, expect, test } from 'vitest'

import { UrnParseError, UrnSerializeError } from '@/errors.ts'

describe('UrnParseError', () => {
  test('is an Error instance', () => {
    const error = new UrnParseError('INVALID_SCHEME', 0, 'foo', 'bad')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(UrnParseError)
  })

  test('exposes code, position, input, name, message', () => {
    const error = new UrnParseError('INVALID_NID', 4, 'urn::x', 'NID empty')
    expect(error.code).toBe('INVALID_NID')
    expect(error.position).toBe(4)
    expect(error.input).toBe('urn::x')
    expect(error.message).toBe('NID empty')
    expect(error.name).toBe('UrnParseError')
  })
})

describe('UrnSerializeError', () => {
  test('is an Error instance', () => {
    const error = new UrnSerializeError('INVALID_NSS_CHAR', 'nss', 2, 'bad char')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(UrnSerializeError)
  })

  test('exposes code, field, position, name, message', () => {
    const error = new UrnSerializeError('INVALID_NID', 'nid', 0, 'bad')
    expect(error.code).toBe('INVALID_NID')
    expect(error.field).toBe('nid')
    expect(error.position).toBe(0)
    expect(error.message).toBe('bad')
    expect(error.name).toBe('UrnSerializeError')
  })
})
