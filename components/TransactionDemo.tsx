'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ec as EC } from 'elliptic'

// Initialize elliptic curve instance
const ec = new EC('secp256k1')

interface KeyPair {
  private: string
  public: string
}

interface Wallet {
  address: string
  balance: number
  keyPair: KeyPair
}

interface Transaction {
  from: string
  to: string
  amount: number
  timestamp: number
  signature?: string
  isVerified?: boolean
}

export default function TransactionDemo() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedFrom, setSelectedFrom] = useState('')
  const [selectedTo, setSelectedTo] = useState('')
  const [amount, setAmount] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<string>('')

  // Generate key pairs for initial wallets
  useEffect(() => {
    const initialWallets = ['Alice', 'Bob', 'Charlie'].map(name => {
      const keyPair = ec.genKeyPair()
      return {
        address: name,
        balance: 100,
        keyPair: {
          private: keyPair.getPrivate('hex'),
          public: keyPair.getPublic('hex')
        }
      }
    })
    setWallets(initialWallets)
  }, [])

  const signTransaction = (transaction: Omit<Transaction, 'signature'>, privateKey: string): string => {
    const keyPair = ec.keyFromPrivate(privateKey)
    const msgHash = JSON.stringify({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    })
    const signature = keyPair.sign(msgHash)
    return signature.toDER('hex')
  }

  const verifyTransaction = (transaction: Transaction, publicKey: string): boolean => {
    if (!transaction.signature) return false

    const key = ec.keyFromPublic(publicKey, 'hex')
    const msgHash = JSON.stringify({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    })

    try {
      return key.verify(msgHash, transaction.signature)
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  const handleTransaction = () => {
    const fromWallet = wallets.find(w => w.address === selectedFrom)
    const toWallet = wallets.find(w => w.address === selectedTo)
    const transactionAmount = Number(amount)

    if (!fromWallet || !toWallet || !transactionAmount) return
    if (fromWallet.balance < transactionAmount) {
      setVerificationStatus('Insufficient balance')
      return
    }
    if (selectedFrom === selectedTo) {
      setVerificationStatus('Cannot send to same wallet')
      return
    }

    // Create transaction
    const transaction: Omit<Transaction, 'signature'> = {
      from: selectedFrom,
      to: selectedTo,
      amount: transactionAmount,
      timestamp: Date.now(),
    }

    // Sign transaction
    const signature = signTransaction(transaction, fromWallet.keyPair.private)

    // Verify transaction
    const isVerified = verifyTransaction(
      { ...transaction, signature },
      fromWallet.keyPair.public
    )

    if (!isVerified) {
      setVerificationStatus('Transaction signature verification failed')
      return
    }

    // Update wallet balances
    setWallets(wallets.map(wallet => {
      if (wallet.address === selectedFrom) {
        return { ...wallet, balance: wallet.balance - transactionAmount }
      }
      if (wallet.address === selectedTo) {
        return { ...wallet, balance: wallet.balance + transactionAmount }
      }
      return wallet
    }))

    // Add transaction to history
    setTransactions([
      {
        ...transaction,
        signature,
        isVerified: true
      },
      ...transactions,
    ])

    // Reset form and status
    setAmount('')
    setVerificationStatus('Transaction verified and completed')
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Transaction Demonstration</h2>
        <p className="text-gray-300 mb-4">
          Send cryptocurrency between wallets with digital signatures for security.
          Each transaction is signed by the sender's private key and verified using their public key.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Wallets</h3>
          <div className="space-y-4">
            {wallets.map(wallet => (
              <motion.div
                key={wallet.address}
                className="p-4 bg-surface rounded-lg border border-gray-700"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{wallet.address}</span>
                  <span className="text-primary">{wallet.balance} COIN</span>
                </div>
                <div className="mt-2 text-xs text-gray-400 break-all">
                  <div>Public Key: {wallet.keyPair.public.substring(0, 32)}...</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">New Transaction</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">From</label>
              <select
                value={selectedFrom}
                onChange={(e) => setSelectedFrom(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-surface text-white border border-gray-700"
              >
                <option value="">Select wallet</option>
                {wallets.map(wallet => (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.address} ({wallet.balance} COIN)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">To</label>
              <select
                value={selectedTo}
                onChange={(e) => setSelectedTo(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-surface text-white border border-gray-700"
              >
                <option value="">Select wallet</option>
                {wallets.map(wallet => (
                  <option
                    key={wallet.address}
                    value={wallet.address}
                    disabled={wallet.address === selectedFrom}
                  >
                    {wallet.address} ({wallet.balance} COIN)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="1"
                className="w-full px-4 py-2 rounded-md bg-surface text-white border border-gray-700"
                placeholder="Enter amount..."
              />
            </div>

            {verificationStatus && (
              <div className={`text-sm ${verificationStatus.includes('failed') || verificationStatus.includes('Insufficient') ? 'text-red-400' : 'text-green-400'}`}>
                {verificationStatus}
              </div>
            )}

            <button
              onClick={handleTransaction}
              disabled={!selectedFrom || !selectedTo || !amount || selectedFrom === selectedTo}
              className="button w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign & Send Transaction
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.timestamp}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-surface rounded-lg border border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-400">{tx.from}</span>
                  <span className="mx-2">→</span>
                  <span className="text-gray-400">{tx.to}</span>
                </div>
                <span className="text-primary">{tx.amount} COIN</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1 break-all">
                <strong>Signature:</strong> {tx.signature?.substring(0, 32)}...
              </div>
              {tx.isVerified && (
                <div className="text-xs text-green-400 mt-1">
                  ✓ Verified
                </div>
              )}
            </motion.div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}