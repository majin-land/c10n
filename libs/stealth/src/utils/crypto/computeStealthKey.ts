import { CURVE, getSharedSecret } from '@noble/secp256k1'
import { hexToBytes } from 'viem'
import { getHashedSharedSecret, handleSchemeId } from './generateStealthAddress'
import type { HexString, IComputeStealthKeyParams } from './types'

function computeStealthKey({
  ephemeralPublicKey,
  schemeId,
  spendingPrivateKey,
  viewingPrivateKey,
}: IComputeStealthKeyParams): HexString {
  handleSchemeId(schemeId)

  const sharedSecret = getSharedSecret(
    hexToBytes(viewingPrivateKey),
    hexToBytes(ephemeralPublicKey),
  )

  const hashedSharedSecret = getHashedSharedSecret({ sharedSecret, schemeId })

  const spendingPrivateKeyBigInt = BigInt(spendingPrivateKey)
  const hashedSecretBigInt = BigInt(hashedSharedSecret)

  // Compute the stealth private key by summing the spending private key and the hashed shared secret.
  const stealthPrivateKeyBigInt = addPriv({
    a: spendingPrivateKeyBigInt,
    b: hashedSecretBigInt,
  })

  const stealthPrivateKeyHex = `0x${stealthPrivateKeyBigInt
    .toString(16)
    .padStart(64, '0')}` as HexString

  return stealthPrivateKeyHex
}

// Adds two private key scalars, ensuring the resulting key is within the elliptic curve's valid scalar range (modulo the curve's order).
function addPriv({ a, b }: { a: bigint; b: bigint }) {
  const curveOrderBigInt = BigInt(CURVE.n)
  return (a + b) % curveOrderBigInt
}

export { addPriv }
export default computeStealthKey
