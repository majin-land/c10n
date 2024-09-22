'use client'

import { useState } from 'react'
import { generateStealthAddress } from '@c10n/stealth'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useNear } from '@/contexts/near'

export const StealthTest = () => {
  const { eth, signedAccountId } = useNear()
  const [addr, setAddr] = useState('')
  const [metaAddr, setMetaAddr] = useState('')

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
    setAddr(result.stealthAddress)
    if (!eth) return
    const balance = await eth.getUSDCBalance(result.stealthAddress)
    console.log('result.stealthAddress usdc balance', balance)
  }

  const getAnnouncements = async () => {
    if (!eth) return
    await eth.getAnnouncements()
  }

  const getStealthMetaAddress = async () => {
    if (!eth) return
    const { address } = await eth.deriveAddress(signedAccountId, 'ethereum-1')
    const meta = await eth.getStealthMetaAddress(address)
    console.log('meta', meta)
    setMetaAddr(meta)
  }

  return (
    <Box>
      <Box>
        <Button onClick={generate} variant="contained">
          Generate
        </Button>
        {addr && (
          <Typography variant="body1">Stealth Address: {addr}</Typography>
        )}
      </Box>
      <Box>
        <Button onClick={getStealthMetaAddress} variant="contained">
          Get Stealth Meta Addres
        </Button>
        {metaAddr && (
          <Typography variant="body1">
            Stealth Meta Address: {metaAddr}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
