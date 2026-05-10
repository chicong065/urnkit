import { canonicalNss } from '@/normalize.ts'
import type { Urn } from '@/types.ts'

/**
 * Returns whether two URNs are lexically equivalent.
 *
 * Equivalence rules:
 * - The `urn` scheme and NID are compared case-insensitively (NIDs are
 *   already lowercased at parse time, so this is a direct string compare).
 * - NSS is compared after canonicalisation (uppercase hex, decoded
 *   unreserved triplets).
 * - r/q/f components are ignored.
 *
 * @param left - First URN.
 * @param right - Second URN.
 * @returns `true` if the URNs are equivalent, `false` otherwise.
 *
 * @example
 * equals(parse("urn:Example:%41"), parse("urn:example:A"));    // true
 * equals(parse("urn:example:foo"), parse("urn:example:Foo"));  // false (NSS is case-sensitive)
 * equals(parse("urn:example:foo?+r1"), parse("urn:example:foo?+r2")); // true (r ignored)
 *
 * @see https://www.rfc-editor.org/rfc/rfc8141#section-3
 */
export function equals(left: Urn, right: Urn): boolean {
  if (left === right) {
    return true
  }
  if (left.nid !== right.nid) {
    return false
  }
  if (left.nss === right.nss) {
    return true
  }
  return canonicalNss(left.nss) === canonicalNss(right.nss)
}
