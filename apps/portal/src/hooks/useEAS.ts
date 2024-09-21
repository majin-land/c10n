'use client'
import { EAS } from '@ethereum-attestation-service/eas-sdk'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY
const EAS_ADDRESS = process.env.EAS_CONTRACT_ADDRESS
const PROVIDER = process.env.EAS_PROVIDER_URL || 'https://sepolia.optimism.io'

export const useEAS = () => {
  const [eas, setEAS] = useState<EAS>()

  useEffect(() => {
    const init = async () => {
      if (!PRIVATE_KEY || !EAS_ADDRESS) return
      // Initialize the sdk with the address of the EAS Schema contract address
      const easInstance = new EAS(EAS_ADDRESS)

      // Gets a default provider (in production use something else like infura/alchemy)
      const provider = ethers.getDefaultProvider(PROVIDER)
      const signer = new ethers.Wallet(PRIVATE_KEY, provider)

      // Connects an ethers style provider/signingProvider to perform read/write functions.
      easInstance.connect(signer)
      setEAS(easInstance)
    }

    init()
  }, [eas])

  return { eas }
}
