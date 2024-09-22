'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import { NearChainAbstractTest } from '@/components/near/chain-abstract-test'
import { StealthTest } from '@/components/stealth/test'

export default function Test() {
  return (
    <>
      <Container maxWidth="lg">
        <NearChainAbstractTest />
        <StealthTest />
      </Container>
    </>
  )
}
