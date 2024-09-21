import * as React from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{ backgroundColor: '#4F4CEE', p: '37px', mt: 4 }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="body1"
          color="white"
          align="right"
        >
          © {new Date().getFullYear()} Haus Team
        </Typography>
      </Container>
    </Box>
  )
}
