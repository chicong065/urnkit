import { serialize } from '@/serialize.ts'
import type { Urn } from '@/types.ts'

/**
 * Type guard that returns `true` when `value` is a structurally and
 * semantically valid `Urn`. Checks that:
 * - `value` is a non-null, non-array object,
 * - `nid` and `nss` are strings,
 * - optional component fields are strings or absent,
 * - all fields would pass `serialize` validation (legal characters, valid
 *   percent-encoding, NID rules).
 *
 * Stricter than a shape check — this validates content too, so a value that
 * survives `isUrn` is guaranteed safe to pass to `serialize`. Useful at trust
 * boundaries where `Urn`-shaped data arrives from untyped sources
 * (deserialization, network input, etc).
 *
 * @param value - Unknown value to test.
 * @returns `true` (with type narrowing) iff `value` is a valid `Urn`.
 *
 * @example
 * function handle(input: unknown) {
 *   if (isUrn(input)) {
 *     return serialize(input); // input is now typed as Urn
 *   }
 *   throw new Error("expected a Urn");
 * }
 */
export function isUrn(value: unknown): value is Urn {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.nid !== 'string') {
    return false
  }
  if (typeof candidate.nss !== 'string') {
    return false
  }
  if (candidate.rComponent !== undefined && typeof candidate.rComponent !== 'string') {
    return false
  }
  if (candidate.qComponent !== undefined && typeof candidate.qComponent !== 'string') {
    return false
  }
  if (candidate.fComponent !== undefined && typeof candidate.fComponent !== 'string') {
    return false
  }
  try {
    serialize(candidate as Urn)
    return true
  } catch {
    return false
  }
}
