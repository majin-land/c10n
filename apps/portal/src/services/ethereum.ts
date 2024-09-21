import { Web3 } from 'web3'
import { AddressLike, bytesToHex } from '@ethereumjs/util'
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx'
import { Common, Hardfork } from '@ethereumjs/common'
import { Contract, JsonRpcProvider } from 'ethers'
import { parseNearAmount } from 'near-api-js/lib/utils/format'

import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from './kdf'
import { abi } from '@/abi/usdc'

const INFURA_KEY = process.env.INFURA_KEY

const rpcUrlMap: Record<string, string> = {
  eth: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
  op: `https://optimism-sepolia.infura.io/v3/${INFURA_KEY}`,
  arb: `https://arbitrum-sepolia.infura.io/v3/${INFURA_KEY}`,
  base: 'https://sepolia.base.org',
}

const chainIdMap: Record<string, number> = {
  eth: 11155111,
  op: 11155420,
  arb: 421614,
  base: 84532,
}

const chainUSDCMap: Record<string, string> = {
  eth: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  op: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  arb: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  base: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
}

export class Ethereum {
  chain: string
  chain_id: number
  web3: Web3
  provider: JsonRpcProvider

  constructor(chain: string) {
    this.chain = chain
    this.chain_id = chainIdMap[chain]
    const rpcUrl = rpcUrlMap[chain]
    this.web3 = new Web3(rpcUrl)
    this.provider = new JsonRpcProvider(rpcUrl)
    this.queryGasPrice()
  }

  setChain(chain: string) {
    this.chain = chain
    this.chain_id = chainIdMap[chain]
    const rpcUrl = rpcUrlMap[chain]
    this.web3 = new Web3(rpcUrl)
    this.provider = new JsonRpcProvider(rpcUrl)
  }

  async deriveAddress(accountId: string, derivation_path: string) {
    const publicKey = await deriveChildPublicKey(
      najPublicKeyStrToUncompressedHexPoint(),
      accountId,
      derivation_path,
    )
    const address = await uncompressedHexPointToEvmAddress(publicKey)
    return { publicKey: Buffer.from(publicKey, 'hex'), address }
  }

  async queryGasPrice() {
    const block = await this.web3.eth.getBlock('latest')
    if (!block || !block.baseFeePerGas) return null
    const maxFeePerGas = await this.web3.eth.getGasPrice()
    const maxPriorityFeePerGas = await this.web3.eth.getMaxPriorityFeePerGas()
    const buffer = BigInt(2000000000)
    return {
      maxFeePerGas:
        (block.baseFeePerGas > maxFeePerGas
          ? block.baseFeePerGas
          : maxFeePerGas) + buffer,
      maxPriorityFeePerGas,
    }
  }

  async getBalance(accountId: string) {
    const balance = await this.web3.eth.getBalance(accountId)
    return this.web3.utils.fromWei(balance, 'ether')
  }

  async getUSDCBalance(addr: string) {
    const contractAddr = chainUSDCMap[this.chain]
    console.log('contractAddr', this.chain, contractAddr)
    const contract = new Contract(contractAddr, abi, this.provider)
    return await contract['balanceOf'](addr)
  }

  async getContractViewFunction(
    contractAddress: string,
    abi: any,
    methodName: string,
    args: any[] = [],
  ) {
    const contract = new Contract(contractAddress, abi, this.provider)

    return await contract[methodName](...args)
  }

  createUSDCTransferPayload(sender: string, receiver: string, amount: string) {
    const contractAddr = chainUSDCMap[this.chain]
    const contract = new Contract(contractAddr, abi)

    const data = contract.interface.encodeFunctionData('transfer', [
      receiver,
      amount,
    ])
    return this.createPayload(sender, contractAddr, 0, data)
  }

  createTransactionData(
    contractAddress: string,
    abi: any,
    methodName: string,
    args: any[] = [],
  ) {
    const contract = new Contract(contractAddress, abi)

    return contract.interface.encodeFunctionData(methodName, args)
  }

  async createPayload(
    sender: string,
    receiver: AddressLike,
    amount: number,
    data: any,
  ) {
    const common = Common.custom(
      { chainId: this.chain_id },
      { hardfork: Hardfork.Paris },
    )

    // Get the nonce & gas price
    const nonce = await this.web3.eth.getTransactionCount(sender)
    const gas = await this.queryGasPrice()
    if (!gas) return null
    const { maxFeePerGas, maxPriorityFeePerGas } = gas

    // Construct transaction
    const transactionData = {
      nonce,
      gasLimit: 50_000,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to: receiver,
      data: data,
      value: BigInt(this.web3.utils.toWei(amount, 'ether')),
      chain: this.chain_id,
    }

    // Create a transaction
    const transaction = FeeMarketEIP1559Transaction.fromTxData(
      transactionData,
      { common },
    )
    const payload = transaction.getHashedMessageToSign()

    // Store in sessionStorage for later
    sessionStorage.setItem('transaction', transaction.serialize())

    return { transaction, payload }
  }

  async requestSignatureToMPC(wallet, contractId, path, ethPayload) {
    // Ask the MPC to sign the payload
    sessionStorage.setItem('derivation', path)

    const payload = Array.from(ethPayload)
    const { big_r, s, recovery_id } = await wallet.callMethod({
      contractId,
      method: 'sign',
      args: { request: { payload, path, key_version: 0 } },
      gas: '100000000000000',
      deposit: parseNearAmount('0.25'),
    })
    return { big_r, s, recovery_id }
  }

  async reconstructSignature(big_r, S, recovery_id, transaction) {
    // reconstruct the signature
    const r = Buffer.from(big_r.affine_point.substring(2), 'hex')
    const s = Buffer.from(S.scalar, 'hex')
    const v = recovery_id

    const signature = transaction.addSignature(v, r, s)

    if (signature.getValidationErrors().length > 0)
      throw new Error('Transaction validation errors')
    if (!signature.verifySignature()) throw new Error('Signature is not valid')
    return signature
  }

  async reconstructSignatureFromLocalSession(big_r, s, recovery_id, sender) {
    const serialized = Uint8Array.from(
      JSON.parse(`[${sessionStorage.getItem('transaction')}]`),
    )
    const transaction = FeeMarketEIP1559Transaction.fromSerializedTx(serialized)
    console.log('transaction', transaction)
    return this.reconstructSignature(big_r, s, recovery_id, transaction, sender)
  }

  // This code can be used to actually relay the transaction to the Ethereum network
  async relayTransaction(signedTransaction) {
    console.log('signedTransaction', signedTransaction)
    const serializedTx = bytesToHex(signedTransaction.serialize())
    console.log('serializedTx', serializedTx)
    const relayed = await this.web3.eth.sendSignedTransaction(serializedTx)
    return relayed.transactionHash
  }
}
