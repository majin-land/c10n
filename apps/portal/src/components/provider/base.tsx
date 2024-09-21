'use client'

import '@fontsource/open-sans'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

import { NearProvider } from './near'
import { wagmiConfig } from './wagmi'

const queryClient = new QueryClient()

const BaseProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NearProvider>{children}</NearProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default BaseProvider
