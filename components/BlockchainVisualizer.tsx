'use client'

import { motion } from 'framer-motion'
import { useBlockchain } from '../contexts/BlockchainContext'
import { useState } from 'react'
import { ec as EC } from 'elliptic'
import CryptoJS from 'crypto-js'

// Initialize elliptic curve instance
const ec = new EC('secp256k1')

interface Transaction {
  from: string
  to: string
  amount: number
  timestamp: number
  signature?: string
  isVerified?: boolean
  isValid?: boolean
}

export default function BlockchainVisualizer() {
  const {
    blockchain,
    pendingTransactions,
    difficulty,
    updateTransaction,
    isMining,
    currentMiningBlock,
    miningProgress
  } = useBlockchain()
  const [processingTx, setProcessingTx] = useState<number | null>(null)

  const handleSign = async (tx: Transaction, index: number) => {
    setProcessingTx(index)
    try {
      // Simulate key generation (in real app, this would come from wallet)
      const keyPair = ec.genKeyPair()
      const privateKey = keyPair.getPrivate('hex')

      // Create transaction hash
      const txHash = CryptoJS.SHA256(JSON.stringify({
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        timestamp: tx.timestamp
      })).toString()

      // Sign transaction
      const signature = keyPair.sign(txHash).toDER('hex')

      // Update transaction with signature
      const signedTx = { ...tx, signature }
      updateTransaction(index, signedTx)
    } catch (error) {
      console.error('Error signing transaction:', error)
    }
    setProcessingTx(null)
  }

  const handleVerify = async (tx: Transaction, index: number) => {
    setProcessingTx(index)
    try {
      // In a real app, we would verify against the actual public key
      // Here we're just simulating the verification process
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate verification time

      const verifiedTx = { ...tx, isVerified: true }
      updateTransaction(index, verifiedTx)
    } catch (error) {
      console.error('Error verifying transaction:', error)
    }
    setProcessingTx(null)
  }

  const handleValidate = async (tx: Transaction, index: number) => {
    setProcessingTx(index)
    try {
      // Validate transaction (check balance, format, etc.)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate validation time

      const validatedTx = { ...tx, isValid: true }
      updateTransaction(index, validatedTx)
    } catch (error) {
      console.error('Error validating transaction:', error)
    }
    setProcessingTx(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Current Blockchain</h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{blockchain.length}</div>
                <div className="text-sm text-gray-600">Chain Height</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{difficulty}</div>
                <div className="text-sm text-gray-600">Mining Difficulty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{pendingTransactions.length}</div>
                <div className="text-sm text-gray-600">Pending Tx</div>
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded flex items-center space-x-4">
              <div className="space-y-1 text-sm">
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Chain Verified
                </div>
              </div>
              {isMining && (
                <div className="space-y-1 text-sm border-l border-gray-300 pl-4">
                  <div className="flex items-center text-blue-600">
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mining Block #{currentMiningBlock?.index}
                    <span className="ml-2 text-xs">({Math.round(miningProgress * 100)}%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex space-x-4 min-w-max pb-4">
            {blockchain.map((block, index) => (
              <motion.div
                key={block.hash}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 w-80 p-4 border-2 border-blue-200 rounded-lg bg-blue-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-800">Block #{block.index}</span>
                  <span className="text-sm text-blue-600">
                    Nonce: {block.nonce}
                  </span>
                </div>
                <div className="text-sm font-mono break-all text-blue-700 mb-2">
                  Hash: {block.hash.substring(0, 20)}...
                </div>
                <div className="text-sm text-blue-600 mb-2">
                  Prev: {block.previousHash === '0' ? 'Genesis' : block.previousHash.substring(0, 8)}...
                </div>
                {block.data && (
                  <div className="text-sm text-blue-600 mb-2">
                    Data: {block.data}
                  </div>
                )}
                <div className="text-sm text-blue-600">
                  Transactions: {block.transactions.length}
                </div>
              </motion.div>
            ))}
            {isMining && currentMiningBlock && (
              <motion.div
                key="mining-block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 w-80 p-4 border-2 border-yellow-300 rounded-lg bg-yellow-50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-100 to-transparent animate-shimmer"
                     style={{
                       backgroundSize: '200% 100%',
                       animation: 'shimmer 2s infinite linear'
                     }}
                />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-yellow-800">Block #{currentMiningBlock.index}</span>
                    <span className="text-sm text-yellow-600">
                      Nonce: {currentMiningBlock.nonce}
                    </span>
                  </div>
                  <div className="text-sm font-mono break-all text-yellow-700 mb-2">
                    Hash: {currentMiningBlock.hash ? currentMiningBlock.hash.substring(0, 20) + '...' : 'Mining...'}
                  </div>
                  <div className="text-sm text-yellow-600 mb-2">
                    Prev: {currentMiningBlock.previousHash.substring(0, 8)}...
                  </div>
                  <div className="text-sm text-yellow-600">
                    Transactions: {currentMiningBlock.transactions.length}
                  </div>
                  <div className="mt-2 h-1 bg-yellow-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${miningProgress * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}