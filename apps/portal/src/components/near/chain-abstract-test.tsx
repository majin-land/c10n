'use client'

import { useState } from 'react'

import { useNear } from '@/contexts/near'
import { EthereumView } from '../ethereum'

export function NearChainAbstractTest() {
  const { signedAccountId } = useNear()
  const [status, setStatus] = useState('Please login to request a signature')
  const [chain, setChain] = useState('eth')

  // parse transactionHashes from URL
  const txHash =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('transactionHashes')
      : null
  const transactions = txHash ? txHash.split(',') : []

  return (
    <>
      <div className="container">
        <h4> 🔗 NEAR Multi Chain </h4>
        <p className="small">
          Safely control accounts on other chains through the NEAR MPC service.
          Learn more in the{' '}
          <a href="https://docs.near.org/abstraction/chain-signatures">
            {' '}
            <b>documentation</b>
          </a>
          .
        </p>

        {signedAccountId && (
          <div style={{ width: '50%', minWidth: '400px' }}>
            <div className="input-group input-group-sm my-2 mb-4">
              <span className="text-primary input-group-text" id="chain">
                Chain
              </span>
              <select
                className="form-select"
                aria-describedby="chain"
                value={chain}
                onChange={(e) => setChain(e.target.value)}
              >
                <option value="eth"> Ξ Ethereum </option>
                <option value="op"> Optimism </option>
                <option value="base"> Base </option>
                <option value="arb"> Arbitrum </option>
              </select>
            </div>

            {chain === 'eth' && (
              <EthereumView props={{ setStatus, transactions }} />
            )}
          </div>
        )}

        <div className="mt-3 small text-center">{status}</div>

        <div
          style={{
            padding: '10px',
            margin: '10px',
            backgroundColor: '#FFC10780',
            borderRadius: '5px',
            fontSize: '15px',
          }}
        >
          ⚠️ Warning: Minimum deposit is used. MPC congestion may cause
          transaction failure. See documentation for details.
        </div>
      </div>
    </>
  )
}
