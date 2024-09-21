import { http, createConfig } from 'wagmi'
import { optimismSepolia } from 'wagmi/chains'

export const wagmiConfig = createConfig({
  chains: [optimismSepolia],
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [optimismSepolia.id]: http(),
  },
})
