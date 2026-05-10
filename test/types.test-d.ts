// oxlint-disable no-unused-expressions -- type-level assertions are intentionally unused at runtime.
import { expectTypeOf } from 'vitest'

import {
  equals,
  isUrn,
  normalize,
  parse,
  safeParse,
  serialize,
  UrnParseError,
  type ParseResult,
  type Urn,
  type UrnErrorCode,
} from '@/index.ts'

// parse returns Urn
expectTypeOf(parse).parameter(0).toEqualTypeOf<string>()
expectTypeOf(parse('')).toEqualTypeOf<Urn>()

// safeParse returns ParseResult
expectTypeOf(safeParse('')).toEqualTypeOf<ParseResult>()

// safeParse result discriminates on `ok`
const result = safeParse('urn:example:foo')
if (result.ok) {
  expectTypeOf(result.value).toEqualTypeOf<Urn>()
} else {
  expectTypeOf(result.error).toEqualTypeOf<UrnParseError>()
}

// serialize takes Urn returns string
expectTypeOf(serialize).parameter(0).toEqualTypeOf<Urn>()
expectTypeOf(serialize({ nid: 'x', nss: 'y' })).toEqualTypeOf<string>()

// equals
expectTypeOf(equals).parameters.toEqualTypeOf<[Urn, Urn]>()
expectTypeOf(equals({ nid: 'x', nss: 'y' }, { nid: 'x', nss: 'y' })).toEqualTypeOf<boolean>()

// normalize
expectTypeOf(normalize).parameter(0).toEqualTypeOf<Urn>()
expectTypeOf(normalize({ nid: 'x', nss: 'y' })).toEqualTypeOf<Urn>()

// isUrn narrows unknown to Urn
const unknownValue: unknown = {}
if (isUrn(unknownValue)) {
  expectTypeOf(unknownValue).toEqualTypeOf<Urn>()
}

// UrnErrorCode is a string literal union
expectTypeOf<UrnErrorCode>().toEqualTypeOf<
  | 'INVALID_SCHEME'
  | 'INVALID_NID'
  | 'EMPTY_NSS'
  | 'INVALID_NSS_CHAR'
  | 'INVALID_PERCENT_ENCODING'
  | 'INVALID_COMPONENT_ORDER'
  | 'INVALID_COMPONENT_CHAR'
  | 'UNEXPECTED_END'
>
