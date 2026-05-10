import type { UrnErrorCode } from '@/types.ts'

/**
 * Thrown by `parse` (and surfaced by `safeParse`) when the input is not a
 * syntactically valid URN. The `code` field discriminates the failure reason;
 * `position` is the byte offset in `input` where parsing failed.
 *
 * Branch on `code` for programmatic handling. The `message` is human-oriented
 * and may change between versions.
 *
 * @example
 * try {
 *   parse(userInput);
 * } catch (error) {
 *   if (error instanceof UrnParseError && error.code === "INVALID_NID") {
 *     // handle invalid NID at error.position
 *   }
 * }
 */
export class UrnParseError extends Error {
  readonly code: UrnErrorCode
  readonly position: number
  readonly input: string

  constructor(code: UrnErrorCode, position: number, input: string, message: string) {
    super(message)
    this.name = 'UrnParseError'
    this.code = code
    this.position = position
    this.input = input
  }
}

/**
 * Names of the `Urn` fields that `serialize` validates. Used by
 * `UrnSerializeError.field` to identify which input field caused the failure.
 */
export type SerializeField = 'nid' | 'nss' | 'rComponent' | 'qComponent' | 'fComponent'

/**
 * Thrown by `serialize` when the supplied `Urn` has illegal characters or
 * invalid percent-encoding. `field` identifies which `Urn` property was at
 * fault; `position` is the offset within that field's value.
 *
 * `serialize` is strict and never auto-encodes — pre-encode raw text with
 * `percentEncode` to avoid these errors.
 */
export class UrnSerializeError extends Error {
  readonly code: UrnErrorCode
  readonly field: SerializeField
  readonly position: number

  constructor(code: UrnErrorCode, field: SerializeField, position: number, message: string) {
    super(message)
    this.name = 'UrnSerializeError'
    this.code = code
    this.field = field
    this.position = position
  }
}
