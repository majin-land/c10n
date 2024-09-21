'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import { NearChainAbstractTest } from '@/components/near/chain-abstract-test'

export default function Test() {
  return (
    <>
      <Container maxWidth="lg">
        <NearChainAbstractTest />
      </Container>
    </>
  )
}
