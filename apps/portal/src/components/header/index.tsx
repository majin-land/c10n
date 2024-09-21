'use client'

import Image from 'next/image'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import { useNear } from '@/contexts/near'

export default function Header() {
  const { wallet, signedAccountId } = useNear()

  const signIn = () => {
    if (!wallet) return
    wallet.signIn()
  }

  const signOut = () => {
    if (!wallet) return
    wallet.signOut()
  }

  return (
    <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          component="h2"
          variant="h5"
          color="inherit"
          noWrap
          sx={{ flex: 1 }}
        >
          <Link href="/" underline="none">
            <Image src="/C10N_small.png" alt="C10N" width={110} height={40} />
          </Link>
        </Typography>
        <Stack gap={2} direction="row" alignItems="center">
          {signedAccountId ? (
            <button className="btn btn-secondary" onClick={signOut}>
              Logout {signedAccountId}
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={signIn}>
              Login
            </button>
          )}
        </Stack>
      </Container>
    </Toolbar>
  )
}
