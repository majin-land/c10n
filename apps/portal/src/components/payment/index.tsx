'use client'

import { useEffect, useState } from 'react'
import { faker } from '@faker-js/faker'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useNear } from '@/contexts/near'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import web3 from 'web3'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import dynamic from 'next/dynamic'

import { generateStealthAddress } from '@c10n/stealth'
import { MPC_CONTRACT } from '@/config/constant'
import { Employee } from './employee'
import dotsJson from './dots.json'

const Lottie = dynamic(
  () => import('react-lottie-player/dist/LottiePlayerLight'),
  { ssr: false },
)

export const Payment = () => {
  const { eth, base, arb, signedAccountId, wallet } = useNear()
  const [addr, setAddr] = useState('')
  const [stealthAddr, setStealthAddr] = useState(
    sessionStorage.getItem('stealthAddr') || '',
  )
  const [signedTransaction, setSignedTransaction] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState({
    op: '0',
    arb: '0',
    base: '0',
    near: '0',
  })

  // parse transactionHashes from URL
  const txHash =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('transactionHashes')
      : null
  const transactions = txHash ? txHash.split(',') : []

  const [step, setStep] = useState(transactions ? 'relay' : 'request')
  const [reloaded, setReloaded] = useState(transactions.length ? true : false)

  const getUSDCBalance = async () => {
    if (!eth || !arb || !base) return
    const { address } = await eth.deriveAddress(signedAccountId, 'ethereum-1')
    setAddr(address)

    const [opBalance, arbBalance, baseBalance] = await Promise.all([
      eth.getUSDCBalance(address),
      arb.getUSDCBalance(address),
      base.getUSDCBalance(address),
    ])
    console.log('opBalance', opBalance)
    setBalance((prevState) => ({
      ...prevState,
      op: opBalance ? web3.utils.fromWei(opBalance, 6) : '0',
      arb: arbBalance ? web3.utils.fromWei(arbBalance, 6) : '0',
      base: baseBalance ? web3.utils.fromWei(baseBalance, 6) : '0',
    }))
  }

  const fetchNearUSDC = async () => {
    if (!wallet) return
    const b = await wallet.viewMethod({
      contractId:
        '3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af',
      method: 'ft_balance_of',
      args: { account_id: 'majin.testnet' },
    })
    console.log('near balance', b)
    setBalance((prevState) => ({
      ...prevState,
      near: b ? web3.utils.fromWei(b, 6) : '0',
    }))
  }

  const generate = async () => {
    // The stealth meta-address URI Follows the format: "st:<chain>:<stealthMetaAddress>", where <chain> is the chain identifier (https://eips.ethereum.org/EIPS/eip-3770#examples) and <stealthMetaAddress> is the stealth meta-address.
    // You can also use the stealth meta-address directly, without the URI prefix.
    const stealthMetaAddressURI =
      'st:eth:0x036027ed270b41aa32fccc91971b6ae0419ceb6dbbd565c69d768cf05551b8df63028c9aa791111e2b8bb971785e7eadd41656265082cfbb776d11bc4aef0823e5ab'

    // Generate a stealth address using the default scheme (1)
    // To learn more about the initial implementation scheme using SECP256k1, please see the reference here (https://eips.ethereum.org/EIPS/eip-5564)
    const result = generateStealthAddress({ stealthMetaAddressURI })

    // Use the stealth address
    console.log(result.stealthAddress)
    setStealthAddr(result.stealthAddress)
    chainSignature(result.stealthAddress, 0.1)
  }

  async function chainSignature(receiver: string, amount: number) {
    if (!wallet || !eth) return
    setLoading(true)
    setStatus('🏗️ Creating transaction')

    const ethPayload = await eth.createUSDCTransferPayload(
      addr,
      receiver,
      amount,
    )
    sessionStorage.setItem('stealthAddr', receiver)

    if (!ethPayload) return

    const { payload } = ethPayload

    setStatus(
      `🕒 Asking ${MPC_CONTRACT} to sign the transaction, this might take a while`,
    )
    await new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
    try {
      await eth.requestSignatureToMPC(
        wallet,
        MPC_CONTRACT,
        'ethereum-1',
        payload,
      )
    } catch (e) {
      // setStatus(`❌ Error: ${e.message}`)
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
          <a
            href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
            target="_blank"
          >
            {' '}
            ✅ Successful{' '}
          </a>
        </>,
      )
    } catch (e) {
      console.log(e)
      setStatus(`❌ Error: ${e.message}`)
    } finally {
      setStep('request')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!signedAccountId) return
    getUSDCBalance()
  }, [signedAccountId])

  useEffect(() => {
    if (!wallet) return
    fetchNearUSDC()
  }, [wallet])

  useEffect(() => {
    // special case for web wallet that reload the whole page
    if (reloaded && addr) signTransaction()

    async function signTransaction() {
      if (!wallet || !eth) return
      const { big_r, s, recovery_id } = await wallet.getTransactionResult(
        transactions[0],
      )

      const signedTransaction = await eth.reconstructSignatureFromLocalSession(
        big_r,
        s,
        recovery_id,
      )
      setSignedTransaction(signedTransaction)
      setStatus(`✅ Signed payload ready to be relayed to the Optimism network`)
      setStep('relay')
      setReloaded(false)
      // removeUrlParams()
    }
  }, [addr])

  useEffect(() => {
    if (!signedTransaction) return
    relayTransaction()
  }, [signedTransaction])

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={4}>
        <Grid item>
          <Paper sx={{ p: 2, width: '400px' }}>
            <Box sx={{ py: 1, borderBottom: '1px solid #efefef' }}>
              <Typography variant="h4">USDC Balance</Typography>
            </Box>
            <Box sx={{ py: 1, borderBottom: '1px solid #efefef' }}>
              <Typography variant="body1">Address:</Typography>
              <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                {addr}
              </Typography>
            </Box>
            <Box sx={{ py: 1, borderBottom: '1px solid #efefef' }}>
              <Grid container>
                <Grid item sx={{ width: '100px' }}>
                  <Typography variant="body1">Near</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">{balance.near}</Typography>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ py: 1, borderBottom: '1px solid #efefef' }}>
              <Grid container>
                <Grid item sx={{ width: '100px' }}>
                  <Typography variant="body1">Base</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">{balance.base}</Typography>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ py: 1, borderBottom: '1px solid #efefef' }}>
              <Grid container>
                <Grid item sx={{ width: '100px' }}>
                  <Typography variant="body1">OP</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{balance.op}</Typography>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ py: 1, borderBottom: '1px solid #efefef' }}>
              <Grid container>
                <Grid item sx={{ width: '100px' }}>
                  <Typography variant="body1">Arbitrum</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{balance.arb}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        <Grid item>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ py: 1, borderBottom: '1px solid #efefef' }}>
              <Typography variant="h4">Employee List</Typography>
            </Box>
            <Employee img="/boy1.png" name="Andy Lind" chain="Base" />
            <Employee img="/girl1.png" name="Mindy MacGyver" chain="Base" />
            <Employee img="/girl2.png" name="Jeanette Becker" chain="OP Main" />
            <Employee
              img="/boy2.png"
              name="Alfred Larson IV"
              chain="OP Main"
              onClick={generate}
            />
            <Employee img="/boy3.png" name="Abraham Rowe" chain="Arbitrum" />
          </Paper>
        </Grid>
      </Grid>
      <Dialog open={stealthAddr}>
        <DialogTitle>Processing payment</DialogTitle>
        <Box sx={{ pt: 2, px: 4, width: '600px' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.9rem', pb: 0.5 }}
                >
                  Stealth Address
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    textWrap: 'wrap',
                    wordWrap: 'break-word',
                  }}
                >
                  {stealthAddr}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.9rem', pb: 0.5 }}
                >
                  Chain:
                </Typography>
                <Typography variant="body1">OP Main</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.9rem', pb: 0.5 }}
                >
                  Payment:
                </Typography>
                <Typography variant="body1">100 USDC</Typography>
              </Box>
            </Grid>
          </Grid>
          <Box>{status}</Box>
          {loading && (
            <Box sx={{ mt: -2 }}>
              <Lottie
                play
                loop
                style={{
                  width: '100px',
                  height: 'auto',
                  margin: 'auto',
                }}
                animationData={dotsJson}
                rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
              />
            </Box>
          )}
          {!loading && step == 'request' && (
            <Button
              onClick={() => {
                sessionStorage.setItem('stealthAddr', '')
                setStealthAddr('')
              }}
            >
              Close
            </Button>
          )}
        </Box>
      </Dialog>
    </Box>
  )
}
