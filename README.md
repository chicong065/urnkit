# urnkit

RFC 8141-compliant parser and serializer for Uniform Resource Names (URNs):

- Parses, serializes, normalizes, and compares URNs per [RFC 8141](https://datatracker.ietf.org/doc/html/rfc8141).
- TypeScript-first with full type inference.
- ~2 KB gzipped, zero runtime dependencies, dual ESM and CJS.
- One pass scanner with no regex.

## Installation

```sh
npm install urnkit
# or
pnpm add urnkit
# or
yarn add urnkit
```

## Quick start

### Parse a URN

`parse` throws on invalid input. `safeParse` returns a discriminated result instead. Pick the one that matches how much you trust the input.

```ts
import { parse, safeParse } from 'urnkit'

// parse throws on invalid input. Use when the URN is trusted.
const urn = parse('urn:isbn:9780321765723')
urn.nid // "isbn"
urn.nss // "9780321765723"

// The parser fills in r, q, and f components when the input has them.
const tagged = parse('urn:example:foo?+r1?=q1#frag')
tagged.rComponent // "r1"
tagged.qComponent // "q1"
tagged.fComponent // "frag"

// safeParse never throws. The result is discriminated on `ok`.
const result = safeParse('not-a-urn')
if (result.ok) {
  result.value.nid // typed as string
} else {
  result.error.code // "INVALID_SCHEME"
  result.error.position // 0
}
```

### Build a URN from raw input

`serialize` is strict and does not encode raw input. Run `percentEncode` first on any text that comes from the user.

```ts
import { percentEncode, serialize } from 'urnkit'

const urn = serialize({
  nid: 'example',
  nss: percentEncode('My document (draft)'),
})
// "urn:example:My%20document%20%28draft%29"
```

### Compare URNs

`equals` returns true when two URNs are considered the same. NID matching ignores case, NSS is canonicalised before comparison (`%41` matches `A`), and r/q/f components are ignored.

```ts
import { equals, parse } from 'urnkit'

equals(parse('URN:Example:%41bc'), parse('urn:example:Abc')) // true
equals(parse('urn:a:foo'), parse('urn:b:foo')) // false
```

### Use a URN as a map key

`normalize` returns a frozen `Urn` with canonical NSS. Two equivalent URNs produce the same string, so `normalize(...).nss` is safe to use as a stable key.

```ts
import { normalize, parse } from 'urnkit'

const left = normalize(parse('urn:example:%41bc'))
const right = normalize(parse('urn:example:Abc'))
left.nss === right.nss // true (both "Abc")
```

## API

### `parse(input: string): Urn`

Parses a URN string per RFC 8141. Throws `UrnParseError` when the input is malformed. The NID is lowercased on the returned object. NSS and r/q/f components are kept verbatim.

### `safeParse(input: string): ParseResult`

Like `parse` but never throws. Returns `{ ok: true, value }` on success or `{ ok: false, error }` on failure. The error is the same `UrnParseError` that `parse` would have thrown.

### `serialize(urn: Urn): string`

Builds a canonical URN string from a `Urn`. Throws `UrnSerializeError` when any field contains characters outside the URN grammar or invalid percent triplets. Run `percentEncode` on any raw text before passing it in.

### `equals(left: Urn, right: Urn): boolean`

True when `left` and `right` are lexically equivalent. NID matching ignores case, NSS is canonicalised before comparison (`%41` matches `A`), and r/q/f components are ignored.

### `normalize(urn: Urn): Urn`

Returns a frozen `Urn` with canonical NSS (uppercase hex digits in `%HH` triplets, unreserved bytes decoded to literals). Other fields are copied through unchanged. Idempotent. Useful for using URNs as cache or map keys, since two equivalent inputs produce the same `nss`.

### `isUrn(value: unknown): value is Urn`

Structural and semantic type guard. Returns `true` when `value` has the `Urn` shape AND would pass `serialize` validation. Use at trust boundaries where typed data arrives from untyped sources (deserialization, network input).

### `percentEncode(text: string): string`

Percent encodes a string for use as NSS or component content. Leaves bytes in the RFC 3986 unreserved set verbatim (letters, digits, hyphen, period, underscore, and tilde) and replaces every other byte with a `%HH` triplet in uppercase hex.

### Types

```ts
type Urn = Readonly<{
  nid: string // always lowercase
  nss: string // verbatim, may contain %HH triplets
  rComponent?: string
  qComponent?: string
  fComponent?: string
}>

type ParseResult = Readonly<{ ok: true; value: Urn }> | Readonly<{ ok: false; error: UrnParseError }>

type UrnErrorCode =
  | 'INVALID_SCHEME'
  | 'INVALID_NID'
  | 'EMPTY_NSS'
  | 'INVALID_NSS_CHAR'
  | 'INVALID_PERCENT_ENCODING'
  | 'INVALID_COMPONENT_ORDER'
  | 'INVALID_COMPONENT_CHAR'
  | 'UNEXPECTED_END'

type SerializeField = 'nid' | 'nss' | 'rComponent' | 'qComponent' | 'fComponent'
```

### Errors

```ts
class UrnParseError extends Error {
  readonly code: UrnErrorCode
  readonly position: number // byte offset in input
  readonly input: string
}

class UrnSerializeError extends Error {
  readonly code: UrnErrorCode
  readonly field: SerializeField
  readonly position: number // byte offset in the offending field
}
```

Branch on `error.code` for programmatic handling. The `message` is for humans and may change between versions.

## License

[MIT License](./LICENSE) © 2026-present [Cong Nguyen](https://github.com/chicong065)
