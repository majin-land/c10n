import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { MPC_CONTRACT } from '@/config/constant'
import { useNear } from '@/contexts/near'
import { useDebounce } from '@/hooks/debounce'
import web3 from 'web3'

export function EthereumView({
  props: { setStatus, transactions, chain },
}: any) {
  const { wallet, signedAccountId, eth } = useNear()

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(transactions ? 'relay' : 'request')
  const [signedTransaction, setSignedTransaction] = useState(null)

  const [senderLabel, setSenderLabel] = useState('')
  const [senderAddress, setSenderAddress] = useState('')
  const [action, setAction] = useState('transfer')
  const [derivation, setDerivation] = useState(
    sessionStorage.getItem('derivation') || 'ethereum-1',
  )
  const [receiver, setReceiver] = useState(
    '0x0f144dD8c139FB3c0783Cac5Df90eC0c12eF7046',
  )
  const [amount, setAmount] = useState(0.005)

  const derivationPath = useDebounce(derivation, 1200)

  const [reloaded, setReloaded] = useState(transactions.length ? true : false)

  const setEthAddress = async () => {
    if (!eth) return
    const { address } = await eth.deriveAddress(signedAccountId, derivationPath)
    setSenderAddress(address)
    setSenderLabel(address)

    console.log('address', address)

    const balance = await eth.getUSDCBalance(address)
    if (!reloaded)
      setStatus(
        `Your Ethereum address is: ${address}, balance: ${web3.utils.fromWei(balance, 6)} USDC`,
      )
  }

  useEffect(() => {
    // special case for web wallet that reload the whole page
    if (reloaded && senderAddress) signTransaction()

    async function signTransaction() {
      if (!wallet || !eth) return
      const { big_r, s, recovery_id } = await wallet.getTransactionResult(
        transactions[0],
      )
      console.log('transactions[0]', transactions[0])
      console.log('big_r', big_r, 's', s, 'recovery_id', recovery_id)

      const signedTransaction = await eth.reconstructSignatureFromLocalSession(
        big_r,
        s,
        recovery_id,
      )
      setSignedTransaction(signedTransaction)
      setStatus(`✅ Signed payload ready to be relayed to the Ethereum network`)
      setStep('relay')

      setReloaded(false)
      // removeUrlParams()
    }
  }, [senderAddress])

  useEffect(() => {
    if (!derivation) return
    setSenderLabel('Waiting for you to stop typing...')
    setStatus('Querying Ethereum address and Balance...')
    setSenderAddress('')
    setStep('request')
  }, [derivation])

  useEffect(() => {
    if (!signedAccountId) return
    setEthAddress()
  }, [derivationPath, signedAccountId])

  async function chainSignature() {
    if (!wallet || !eth) return
    setStatus('🏗️ Creating transaction')

    const ethPayload = await eth.createUSDCTransferPayload(
      senderAddress,
      receiver,
      amount,
    )

    if (!ethPayload) return

    const { payload } = ethPayload

    setStatus(
      `🕒 Asking ${MPC_CONTRACT} to sign the transaction, this might take a while`,
    )
    try {
      console.log('requestSignatureToMPC', MPC_CONTRACT, derivationPath)
      await eth.requestSignatureToMPC(
        wallet,
        MPC_CONTRACT,
        derivationPath,
        payload,
      )
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`)
      setLoading(false)
    }
  }

  async function relayTransaction() {
    if (!eth) return
    setLoading(true)
    setStatus(
      '🔗 Relaying transaction to the Ethereum network... this might take a while',
    )

    try {
      const txHash = await eth.relayTransaction(signedTransaction)
      setStatus(
        <>
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank">
            {' '}
            ✅ Successful{' '}
          </a>
        </>,
      )
    } catch (e) {
      console.log(e)
      setStatus(`❌ Error: ${e.message}`)
    }

    setStep('request')
    setLoading(false)
  }

  const UIChainSignature = async () => {
    setLoading(true)
    await chainSignature()
    setLoading(false)
  }

  return (
    <>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">
          Path:
        </label>
        <div className="col-sm-10">
          <input
            type="text"
            className="form-control form-control-sm"
            value={derivation}
            onChange={(e) => setDerivation(e.target.value)}
            disabled={loading}
          />
          <div className="form-text" id="eth-sender">
            {' '}
            {senderLabel}{' '}
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">To:</label>
        <div className="col-sm-10">
          <input
            type="text"
            className="form-control form-control-sm"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">
          Amount:
        </label>
        <div className="col-sm-10">
          <input
            type="number"
            className="form-control form-control-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            disabled={loading}
          />
          <div className="form-text"> Ethereum units </div>
        </div>
      </div>

      <div className="text-center">
        {step === 'request' && (
          <button
            className="btn btn-primary text-center"
            onClick={UIChainSignature}
            disabled={loading}
          >
            {' '}
            Request Signature{' '}
          </button>
        )}
        {step === 'relay' && (
          <button
            className="btn btn-success text-center"
            onClick={relayTransaction}
            disabled={loading}
          >
            {' '}
            Relay Transaction{' '}
          </button>
        )}
      </div>
    </>
  )

  function removeUrlParams() {
    const url = new URL(window.location.href)
    url.searchParams.delete('transactionHashes')
    window.history.replaceState({}, document.title, url)
  }
}

EthereumView.propTypes = {
  props: PropTypes.shape({
    setStatus: PropTypes.func.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
}
