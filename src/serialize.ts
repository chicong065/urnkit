import { CHAR_CLASS_TABLE, CHAR_COMP_BODY, CHAR_HEX, CHAR_NID_BODY, CHAR_NSS_BODY } from '@/encode.ts'
import { UrnSerializeError } from '@/errors.ts'
import type { SerializeField } from '@/errors.ts'
import type { Urn } from '@/types.ts'

const HYPHEN = 0x2d
const PERCENT = 0x25

const NID_MIN_LENGTH = 2
const NID_MAX_LENGTH = 32

function validateNid(nid: string): void {
  if (nid.length < NID_MIN_LENGTH || nid.length > NID_MAX_LENGTH) {
    throw new UrnSerializeError(
      'INVALID_NID',
      'nid',
      0,
      `INVALID_NID: NID length must be ${NID_MIN_LENGTH}-${NID_MAX_LENGTH} chars, got ${nid.length}`
    )
  }
  if (nid.charCodeAt(0) === HYPHEN || nid.charCodeAt(nid.length - 1) === HYPHEN) {
    throw new UrnSerializeError('INVALID_NID', 'nid', 0, 'INVALID_NID: NID cannot start or end with "-"')
  }
  for (let charIndex = 0; charIndex < nid.length; charIndex++) {
    if (!((CHAR_CLASS_TABLE[nid.charCodeAt(charIndex)] ?? 0) & CHAR_NID_BODY)) {
      throw new UrnSerializeError(
        'INVALID_NID',
        'nid',
        charIndex,
        `INVALID_NID: Invalid NID character at position ${charIndex}`
      )
    }
  }
  if (nid.toLowerCase() === 'urn') {
    throw new UrnSerializeError('INVALID_NID', 'nid', 0, 'INVALID_NID: NID cannot be "urn"')
  }
}

function validatePercent(text: string, field: SerializeField, position: number): void {
  if (
    position + 2 >= text.length ||
    !((CHAR_CLASS_TABLE[text.charCodeAt(position + 1)] ?? 0) & CHAR_HEX) ||
    !((CHAR_CLASS_TABLE[text.charCodeAt(position + 2)] ?? 0) & CHAR_HEX)
  ) {
    throw new UrnSerializeError(
      'INVALID_PERCENT_ENCODING',
      field,
      position,
      `INVALID_PERCENT_ENCODING: Invalid percent-encoding at position ${position}`
    )
  }
}

function validateBody(
  text: string,
  field: SerializeField,
  bodyFlag: number,
  errorCode: 'INVALID_NSS_CHAR' | 'INVALID_COMPONENT_CHAR'
): void {
  let charIndex = 0
  while (charIndex < text.length) {
    const codePoint = text.charCodeAt(charIndex)
    if (codePoint === PERCENT) {
      validatePercent(text, field, charIndex)
      charIndex += 3
      continue
    }
    if (!((CHAR_CLASS_TABLE[codePoint] ?? 0) & bodyFlag)) {
      throw new UrnSerializeError(
        errorCode,
        field,
        charIndex,
        `${errorCode}: Invalid character in ${field} at position ${charIndex}`
      )
    }
    charIndex++
  }
}

function validateNss(nss: string): void {
  if (nss.length === 0) {
    throw new UrnSerializeError('EMPTY_NSS', 'nss', 0, 'EMPTY_NSS: NSS cannot be empty')
  }
  validateBody(nss, 'nss', CHAR_NSS_BODY, 'INVALID_NSS_CHAR')
}

function validateComponent(text: string, field: SerializeField): void {
  validateBody(text, field, CHAR_COMP_BODY, 'INVALID_COMPONENT_CHAR')
}

/**
 * Serializes a `Urn` to its canonical string form. Strict — throws if any
 * field contains illegal characters or invalid percent-encoding. The caller
 * is responsible for pre-encoding NSS and component content; use
 * `percentEncode` to encode raw input safely.
 *
 * The NID is lowercased on output. NSS and r/q/f components must already be
 * in URN-safe form (unreserved bytes verbatim, others as `%HH` triplets).
 *
 * @param urn - URN object to serialize.
 * @returns The URN as a string, e.g. `"urn:example:foo?+r1?=q1#f1"`.
 * @throws {UrnSerializeError} If any field has illegal characters or invalid
 *   percent-encoding. Inspect `error.field` to find which field failed.
 *
 * @example
 * serialize({ nid: "example", nss: "foo" });
 * // "urn:example:foo"
 *
 * serialize({ nid: "example", nss: percentEncode("a b") });
 * // "urn:example:a%20b"
 *
 * serialize({ nid: "example", nss: "foo", rComponent: "r1", fComponent: "frag" });
 * // "urn:example:foo?+r1#frag"
 */
export function serialize(urn: Urn): string {
  validateNid(urn.nid)
  validateNss(urn.nss)
  if (urn.rComponent !== undefined) {
    validateComponent(urn.rComponent, 'rComponent')
  }
  if (urn.qComponent !== undefined) {
    validateComponent(urn.qComponent, 'qComponent')
  }
  if (urn.fComponent !== undefined) {
    validateComponent(urn.fComponent, 'fComponent')
  }

  const parts: string[] = ['urn:', urn.nid.toLowerCase(), ':', urn.nss]
  if (urn.rComponent !== undefined) {
    parts.push('?+', urn.rComponent)
  }
  if (urn.qComponent !== undefined) {
    parts.push('?=', urn.qComponent)
  }
  if (urn.fComponent !== undefined) {
    parts.push('#', urn.fComponent)
  }
  return parts.join('')
}
