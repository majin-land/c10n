import { createContext, useContext } from 'react'
import { Wallet } from '@/services/near-wallet'
import { Ethereum } from '@/services/ethereum'

/**
 * @typedef NearContext
 * @property {import('./services/near-wallet').Wallet} wallet Current wallet
 * @property {string} signedAccountId The AccountId of the signed user
 */

interface NearContextType {
  wallet?: Wallet
  signedAccountId: string
  eth?: Ethereum
}

/** @type {import ('react').Context<NearContext>} */
export const NearContext = createContext<NearContextType>({
  wallet: undefined,
  signedAccountId: '',
  eth: undefined,
})

export const useNear = () => {
  const context = useContext(NearContext)
  return context
}
