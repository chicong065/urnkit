const assert = require('node:assert/strict')
const urnkit = require('urnkit')

const urn = urnkit.parse('urn:example:foo?+r1?=q1#f1')
assert.equal(urn.nid, 'example')
assert.equal(urn.nss, 'foo')
assert.equal(urn.rComponent, 'r1')
assert.equal(urn.qComponent, 'q1')
assert.equal(urn.fComponent, 'f1')

const serialized = urnkit.serialize(urn)
assert.equal(serialized, 'urn:example:foo?+r1?=q1#f1')

const safe = urnkit.safeParse('not-a-urn')
assert.equal(safe.ok, false)

assert.equal(urnkit.equals(urnkit.parse('urn:Example:foo'), urnkit.parse('urn:example:foo')), true)

const normalized = urnkit.normalize(urnkit.parse('urn:example:%41'))
assert.equal(normalized.nss, 'A')

assert.equal(urnkit.isUrn({ nid: 'example', nss: 'foo' }), true)
assert.equal(urnkit.isUrn(null), false)

assert.equal(urnkit.percentEncode('a b'), 'a%20b')

console.log('CJS smoke OK')
