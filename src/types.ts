import type { UrnParseError } from '@/errors.ts'

/**
 * Parsed Uniform Resource Name. The `nid` is lowercased on parse; the `nss`
 * and any r/q/f components are preserved verbatim — no canonicalisation.
 * Optional component fields are absent (not present as `undefined`) when the
 * input had no corresponding `?+`, `?=`, or `#` segment.
 *
 * The object returned by `parse` is frozen.
 *
 * @see https://www.rfc-editor.org/rfc/rfc8141
 */
export type Urn = Readonly<{
  nid: string
  nss: string
  rComponent?: string
  qComponent?: string
  fComponent?: string
}>

/**
 * String literal union of every error code carried by `UrnParseError` and
 * `UrnSerializeError`. Branch on `error.code` for programmatic handling;
 * never branch on `error.message`.
 */
export type UrnErrorCode =
  /** The input does not start with a case-insensitive `urn:` prefix. */
  | 'INVALID_SCHEME'
  /** The NID violates length (2–32), character set, leading/trailing hyphen, or the literal `urn` rule. */
  | 'INVALID_NID'
  /** NSS is required and cannot be empty. */
  | 'EMPTY_NSS'
  /** Raw character not allowed in NSS (must be percent-encoded). */
  | 'INVALID_NSS_CHAR'
  /** A `%` was not followed by two hex digits. */
  | 'INVALID_PERCENT_ENCODING'
  /** q-component appeared before r-component, a duplicate component was found, or a stray `?` was seen. */
  | 'INVALID_COMPONENT_ORDER'
  /** Raw character not allowed inside an r/q/f component. */
  | 'INVALID_COMPONENT_CHAR'
  /** Trailing input remained after all components were consumed (defensive; not reachable with the current grammar). */
  | 'UNEXPECTED_END'

/**
 * Successful result of `safeParse`. `value` is the parsed `Urn`.
 */
export type ParseSuccess = Readonly<{ ok: true; value: Urn }>

/**
 * Failed result of `safeParse`. `error` is the same `UrnParseError` that
 * `parse` would have thrown for this input.
 */
export type ParseFailure = Readonly<{ ok: false; error: UrnParseError }>

/**
 * Result of `safeParse`. Discriminated on `ok` — narrow with `if (result.ok)`
 * to access `value`, otherwise `error`.
 */
export type ParseResult = ParseSuccess | ParseFailure
