'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import { Payment } from '@/components/payment'

export default function PaymentPage() {
  return (
    <>
      <Container maxWidth="lg">
        <Payment />
      </Container>
    </>
  )
}
