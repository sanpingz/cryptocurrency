'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ec as EC } from 'elliptic'
import CryptoJS from 'crypto-js'
import { useBlockchain } from '../contexts/BlockchainContext'

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

interface Wallet {
  address: string
  balance: number
  keyPair: {
    private: string
    public: string
  }
}

interface TransactionStatus {
  transaction: Transaction
  status: 'created' | 'broadcast' | 'verified' | 'mined'
  timestamp: number
}

export default function TransactionProcessDemo() {
  const {
    blockchain,
    pendingTransactions,
    addTransaction,
    updateTransaction,
    updateWallets,
    transactionHistory,
    activityLog,
    addActivityLogEntry,
    wallets
  } = useBlockchain()

  // Set default selections for From and To
  const [selectedFrom, setSelectedFrom] = useState('Alice')
  const [selectedTo, setSelectedTo] = useState('Bob')
  const [amount, setAmount] = useState('')

  const verifyTransaction = (transaction: Transaction, publicKey: string): boolean => {
    try {
      const keyPair = ec.keyFromPublic(publicKey, 'hex')
      const transactionHash = CryptoJS.SHA256(JSON.stringify({
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        timestamp: transaction.timestamp
      })).toString()
      return keyPair.verify(transactionHash, transaction.signature!)
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  const validateTransaction = (transaction: Transaction): boolean => {
    const fromWallet = wallets.find(w => w.address === transaction.from)
    return !!(fromWallet && fromWallet.balance >= transaction.amount)
  }

  const handleCreateTransaction = () => {
    const fromWallet = wallets.find(w => w.address === selectedFrom)
    const transactionAmount = Number(amount)

    // Validate sender's balance
    if (!fromWallet) {
      addActivityLogEntry('Sender wallet not found!', 'error')
      return
    }

    if (transactionAmount <= 0) {
      addActivityLogEntry('Amount must be greater than 0!', 'error')
      return
    }

    if (fromWallet.balance < transactionAmount) {
      addActivityLogEntry(`Insufficient balance! ${fromWallet.address} has ${fromWallet.balance} coins, but trying to send ${transactionAmount} coins.`, 'error')
      return
    }

    if (selectedFrom === selectedTo) {
      addActivityLogEntry('Cannot send to the same wallet!', 'error')
      return
    }

    const transaction = {
      from: selectedFrom,
      to: selectedTo,
      amount: transactionAmount,
      timestamp: Date.now()
    }

    // Sign the transaction
    const transactionHash = CryptoJS.SHA256(JSON.stringify(transaction)).toString()
    const keyPair = ec.keyFromPrivate(fromWallet.keyPair.private)
    const signature = keyPair.sign(transactionHash).toDER('hex')

    // Create signed transaction with initial unverified status
    const signedTransaction: Transaction = {
      ...transaction,
      signature,
      isVerified: false,
      isValid: false
    }

    // Add transaction to pool
    addTransaction(signedTransaction)

    // Reset form
    setSelectedFrom('Alice')
    setSelectedTo('Bob')
    setAmount('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="space-y-6">
          {/* Transaction Creation Form */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Transaction</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select
                    value={selectedFrom}
                    onChange={(e) => setSelectedFrom(e.target.value)}
                    className="w-full p-2 border rounded bg-white text-gray-900"
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.address} value={wallet.address}>
                        {wallet.address} ({wallet.balance} coins)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select
                    value={selectedTo}
                    onChange={(e) => setSelectedTo(e.target.value)}
                    className="w-full p-2 border rounded bg-white text-gray-900"
                    disabled={!selectedFrom}
                  >
                    {wallets
                      .filter((wallet) => wallet.address !== selectedFrom)
                      .map((wallet) => (
                        <option key={wallet.address} value={wallet.address}>
                          {wallet.address} ({wallet.balance} coins)
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-2 border rounded bg-white text-gray-900"
                  disabled={!selectedTo}
                />
              </div>
              <button
                onClick={handleCreateTransaction}
                disabled={!selectedFrom || !selectedTo || !amount || Number(amount) <= 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Transaction
              </button>
            </div>
          </div>

          {/* Network Broadcasts */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Network Broadcasts</h3>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {pendingTransactions.map((tx, index) => (
                  <motion.div
                    key={`${tx.from}-${tx.to}-${tx.timestamp}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          From: <span className="font-medium text-gray-900">{tx.from}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          To: <span className="font-medium text-gray-900">{tx.to}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Amount: <span className="font-medium text-gray-900">{tx.amount} coins</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            tx.isVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.isVerified ? 'Verified' : 'Pending Verification'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            tx.isValid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.isValid ? 'Valid' : 'Pending Validation'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {pendingTransactions.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No pending transactions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg p-6 shadow-md"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Transaction History
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({transactionHistory.length} transactions)
          </span>
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {transactionHistory.map((tx) => (
              <motion.div
                key={tx.timestamp}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded transition-colors ${
                  tx.status === 'mined'
                    ? 'bg-green-100'
                    : tx.status === 'verified'
                    ? 'bg-blue-100'
                    : tx.status === 'broadcast'
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'
                }`}
              >
                <div className="flex justify-between text-gray-900">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{tx.transaction.from}</span>
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-medium">{tx.transaction.to}</span>
                  </div>
                  <span className="font-bold">{tx.transaction.amount} coins</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-sm ${
                    tx.status === 'mined'
                      ? 'text-green-700'
                      : tx.status === 'verified'
                      ? 'text-blue-700'
                      : tx.status === 'broadcast'
                      ? 'text-yellow-700'
                      : 'text-gray-700'
                  } font-medium`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {transactionHistory.length === 0 && (
            <div className="text-center text-gray-900">
              No transactions yet
            </div>
          )}
        </div>
      </motion.div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Activity Log</h3>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {activityLog.map((entry) => (
              <motion.div
                key={entry.timestamp}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded ${
                  entry.status === 'success'
                    ? 'bg-green-100 text-green-900'
                    : entry.status === 'error'
                    ? 'bg-red-100 text-red-900'
                    : 'bg-blue-100 text-blue-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{entry.message}</span>
                  <span className="text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {activityLog.length === 0 && (
            <div className="text-center text-gray-900">
              No activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}