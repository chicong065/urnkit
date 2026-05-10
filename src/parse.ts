import { CHAR_CLASS_TABLE, CHAR_COMP_BODY, CHAR_HEX, CHAR_NID_BODY, CHAR_NSS_BODY } from '@/encode.ts'
import { UrnParseError } from '@/errors.ts'
import type { ParseResult, Urn } from '@/types.ts'

const SCHEME_LENGTH = 4 // "urn:"

// ASCII codepoints used as scanner branch conditions. Inline 0x.. literals
// would be equivalent; the names just keep mid-scan reading at one level.
const HYPHEN = 0x2d
const COLON = 0x3a
const HASH = 0x23
const PERCENT = 0x25
const PLUS = 0x2b
const EQUALS = 0x3d
const QUESTION = 0x3f

const NID_MIN_LENGTH = 2
const NID_MAX_LENGTH = 32

type ComponentField = 'r-component' | 'q-component' | 'f-component'

function flagsAt(input: string, cursor: number): number {
  return CHAR_CLASS_TABLE[input.charCodeAt(cursor)] ?? 0
}

function validatePercentTriplet(input: string, length: number, cursor: number): void {
  if (cursor + 2 >= length || !(flagsAt(input, cursor + 1) & CHAR_HEX) || !(flagsAt(input, cursor + 2) & CHAR_HEX)) {
    throw new UrnParseError(
      'INVALID_PERCENT_ENCODING',
      cursor,
      input,
      `INVALID_PERCENT_ENCODING: Invalid percent-encoding at position ${cursor}`
    )
  }
}

function scanComponentBody(
  input: string,
  length: number,
  startCursor: number,
  field: ComponentField,
  hasFollowingComponents: boolean
): number {
  let cursor = startCursor
  while (cursor < length) {
    const codePoint = input.charCodeAt(cursor)
    // r and q components terminate at '#' (f-component start) or at "?+"/"?="
    // (next or duplicate component). f-component has no terminator and runs
    // to end-of-input.
    if (hasFollowingComponents) {
      if (codePoint === HASH) {
        break
      }
      if (codePoint === QUESTION && cursor + 1 < length) {
        const nextCodePoint = input.charCodeAt(cursor + 1)
        if (nextCodePoint === PLUS || nextCodePoint === EQUALS) {
          break
        }
      }
    }
    if (codePoint === PERCENT) {
      validatePercentTriplet(input, length, cursor)
      cursor += 3
      continue
    }
    if (!(flagsAt(input, cursor) & CHAR_COMP_BODY)) {
      throw new UrnParseError(
        'INVALID_COMPONENT_CHAR',
        cursor,
        input,
        `INVALID_COMPONENT_CHAR: Invalid ${field} character at position ${cursor}`
      )
    }
    cursor++
  }
  return cursor
}

function throwStrayQuestion(input: string, cursor: number): never {
  throw new UrnParseError(
    'INVALID_COMPONENT_ORDER',
    cursor,
    input,
    `INVALID_COMPONENT_ORDER: Stray or out-of-order "?" at position ${cursor}`
  )
}

/**
 * Parses a URN string into a frozen `Urn` object. The `urn` scheme and NID
 * are lowercased; the NSS and r/q/f components are preserved verbatim — no
 * canonicalisation. Use `normalize` afterwards if you need canonical NSS
 * (uppercase hex, decoded unreserved triplets).
 *
 * @param input - The URN string to parse.
 * @returns A frozen `Urn`.
 * @throws {UrnParseError} If `input` is not a syntactically valid URN. The
 *   `code` discriminates the failure reason; `position` is the byte offset
 *   where parsing failed.
 *
 * @example
 * const urn = parse("urn:isbn:9780321765723?+r1#frag");
 * urn.nid;        // "isbn"
 * urn.nss;        // "9780321765723"
 * urn.rComponent; // "r1"
 * urn.fComponent; // "frag"
 *
 * @see https://www.rfc-editor.org/rfc/rfc8141#section-2
 */
export function parse(input: string): Urn {
  const length = input.length

  // 1. Scheme: case-insensitive "urn:". OR-ing with 0x20 lowercases ASCII
  // letters; non-letter bytes get garbled and fail the comparison anyway.
  if (
    length < SCHEME_LENGTH ||
    (input.charCodeAt(0) | 0x20) !== 0x75 ||
    (input.charCodeAt(1) | 0x20) !== 0x72 ||
    (input.charCodeAt(2) | 0x20) !== 0x6e ||
    input.charCodeAt(3) !== COLON
  ) {
    throw new UrnParseError('INVALID_SCHEME', 0, input, 'INVALID_SCHEME: Expected "urn:" prefix')
  }

  // 2. NID: 2-32 characters from the alphanumeric-plus-hyphen set, terminated
  // by ':'. Cannot start or end with '-' and cannot lowercase to "urn".
  const nidStart = SCHEME_LENGTH
  let cursor = nidStart
  while (cursor < length && input.charCodeAt(cursor) !== COLON) {
    if (!(flagsAt(input, cursor) & CHAR_NID_BODY)) {
      throw new UrnParseError('INVALID_NID', cursor, input, `INVALID_NID: Invalid NID character at position ${cursor}`)
    }
    cursor++
  }
  if (cursor === length) {
    if (cursor === nidStart) {
      throw new UrnParseError('INVALID_NID', nidStart, input, 'INVALID_NID: NID is empty')
    }
    throw new UrnParseError('INVALID_NID', cursor, input, 'INVALID_NID: Missing ":" after NID')
  }
  const nidEnd = cursor
  const nidLength = nidEnd - nidStart
  if (nidLength < NID_MIN_LENGTH || nidLength > NID_MAX_LENGTH) {
    throw new UrnParseError(
      'INVALID_NID',
      nidStart,
      input,
      `INVALID_NID: NID length must be ${NID_MIN_LENGTH}-${NID_MAX_LENGTH} chars, got ${nidLength}`
    )
  }
  if (input.charCodeAt(nidStart) === HYPHEN) {
    throw new UrnParseError('INVALID_NID', nidStart, input, 'INVALID_NID: NID cannot start with "-"')
  }
  if (input.charCodeAt(nidEnd - 1) === HYPHEN) {
    throw new UrnParseError('INVALID_NID', nidEnd - 1, input, 'INVALID_NID: NID cannot end with "-"')
  }
  const nid = input.slice(nidStart, nidEnd).toLowerCase()
  if (nid === 'urn') {
    throw new UrnParseError('INVALID_NID', nidStart, input, 'INVALID_NID: NID cannot be "urn"')
  }
  cursor++ // skip ':'

  // 3. NSS: terminates at the first '?' or '#'. Every other byte must be a
  // body character or part of a valid percent triplet.
  const nssStart = cursor
  while (cursor < length) {
    const codePoint = input.charCodeAt(cursor)
    if (codePoint === QUESTION || codePoint === HASH) {
      break
    }
    if (codePoint === PERCENT) {
      validatePercentTriplet(input, length, cursor)
      cursor += 3
      continue
    }
    if (!(flagsAt(input, cursor) & CHAR_NSS_BODY)) {
      throw new UrnParseError(
        'INVALID_NSS_CHAR',
        cursor,
        input,
        `INVALID_NSS_CHAR: Invalid NSS character at position ${cursor}`
      )
    }
    cursor++
  }
  if (cursor === nssStart) {
    throw new UrnParseError('EMPTY_NSS', nssStart, input, 'EMPTY_NSS: NSS cannot be empty')
  }

  const result: {
    nid: string
    nss: string
    rComponent?: string
    qComponent?: string
    fComponent?: string
  } = {
    nid,
    nss: input.slice(nssStart, cursor),
  }

  // 4. r-component: introduced by "?+", terminated by '#' or "?+"/"?=".
  if (cursor + 1 < length && input.charCodeAt(cursor) === QUESTION && input.charCodeAt(cursor + 1) === PLUS) {
    cursor += 2
    const rStart = cursor
    cursor = scanComponentBody(input, length, cursor, 'r-component', true)
    result.rComponent = input.slice(rStart, cursor)
  }

  // 5. q-component (starts with "?="). A bare '?' here (no '+' or '=' after)
  // is a stray or out-of-order marker.
  if (cursor + 1 < length && input.charCodeAt(cursor) === QUESTION && input.charCodeAt(cursor + 1) === EQUALS) {
    cursor += 2
    const qStart = cursor
    cursor = scanComponentBody(input, length, cursor, 'q-component', true)
    result.qComponent = input.slice(qStart, cursor)
  } else if (cursor < length && input.charCodeAt(cursor) === QUESTION) {
    throwStrayQuestion(input, cursor)
  }

  // After q-component, any '?' still at cursor is a stray. Example:
  // "?+r1?+r2" — the q-scanner terminates at the second '?+' without
  // consuming it, leaving a '?' here.
  if (cursor < length && input.charCodeAt(cursor) === QUESTION) {
    throwStrayQuestion(input, cursor)
  }

  // 6. f-component: introduced by '#', runs to end-of-input.
  if (cursor < length && input.charCodeAt(cursor) === HASH) {
    cursor++
    const fStart = cursor
    cursor = scanComponentBody(input, length, cursor, 'f-component', false)
    result.fComponent = input.slice(fStart, cursor)
  }

  if (cursor !== length) {
    // Defensive: unreachable under the current grammar. The f-scanner runs
    // to end-of-input, and any non-CHAR_COMP_BODY byte along the way throws
    // INVALID_COMPONENT_CHAR before reaching here. Kept as a safety net in
    // case the grammar grows.
    throw new UrnParseError(
      'UNEXPECTED_END',
      cursor,
      input,
      `UNEXPECTED_END: Unexpected character at position ${cursor}`
    )
  }

  return Object.freeze(result)
}

/**
 * Like `parse` but never throws. Returns a discriminated `ParseResult`:
 * `{ ok: true, value }` on success or `{ ok: false, error }` on failure.
 * The `error` is the same `UrnParseError` `parse` would have thrown.
 *
 * @param input - The URN string to parse.
 * @returns A `ParseResult`. Narrow on `result.ok` to access `value` or `error`.
 *
 * @example
 * const result = safeParse(userInput);
 * if (result.ok) {
 *   useUrn(result.value);
 * } else {
 *   showErrorToUser(result.error.code, result.error.position);
 * }
 */
export function safeParse(input: string): ParseResult {
  try {
    return { ok: true, value: parse(input) }
  } catch (error) {
    return { ok: false, error: error as UrnParseError }
  }
}
