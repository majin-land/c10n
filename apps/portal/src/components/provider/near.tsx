import { useEffect, useState } from 'react'

import { Wallet } from '@/services/near-wallet'
import { NearContext } from '@/contexts/near'
import { Ethereum } from '@/services/ethereum'

export const NearProvider = ({ children }: { children: React.ReactNode }) => {
  const [signedAccountId, setSignedAccountId] = useState('')
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)

  useEffect(() => {
    if (!wallet) return
    wallet.startUp(setSignedAccountId)
  }, [wallet])

  useEffect(() => {
    setWallet(new Wallet({ networkId: 'testnet' }))
  }, [])

  return (
    <NearContext.Provider
      value={{
        wallet,
        signedAccountId,
        eth: new Ethereum('op'),
        base: new Ethereum('base'),
        arb: new Ethereum('arb'),
      }}
    >
      {children}
    </NearContext.Provider>
  )
}
