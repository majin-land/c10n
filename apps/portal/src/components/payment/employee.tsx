'use client'

import { useState } from 'react'
import { generateStealthAddress } from '@c10n/stealth'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useNear } from '@/contexts/near'
import Grid from '@mui/material/Grid'

export const Employee = ({ img, name, chain, onClick }: any) => {
  return (
    <Box sx={{ py: 2, width: '620px' }}>
      <Grid container spacing={2}>
        <Grid item>
          <Avatar src={img} sx={{ width: '60px', height: '60px' }} />
        </Grid>
        <Grid item xs={4}>
          <Typography
            variant="body1"
            sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}
          >
            {name}
          </Typography>
          <Typography variant="body2">$100 per week</Typography>
          <Typography variant="body2">Chain: {chain}</Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
            Pending payment:
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', pt: 0.5 }}>
            USDC 100
          </Typography>
        </Grid>
        <Grid
          item
          sx={{ justifyContent: 'flex-end', flex: 1, textAlign: 'right' }}
        >
          <Button onClick={onClick} variant="contained">
            Make Payment
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
