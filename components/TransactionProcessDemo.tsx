'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ec as EC } from 'elliptic'
import CryptoJS from 'crypto-js'
import { useBlockchain, TransactionStatus } from '../contexts/BlockchainContext'
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaShieldAlt, FaTrash, FaTimes } from 'react-icons/fa'

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
    wallets,
    cancelTransaction
  } = useBlockchain()

  const [fromAddress, setFromAddress] = useState('Alice')
  const [toAddress, setToAddress] = useState('Bob')
  const [amount, setAmount] = useState('')
  const [processingTx, setProcessingTx] = useState<number | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionStatus | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromAddress || !toAddress || !amount) return

    const transaction = {
      from: fromAddress,
      to: toAddress,
      amount: parseFloat(amount),
      timestamp: Date.now()
    }

    addTransaction(transaction)
    setAmount('')
  }

  const handleSign = async (tx: any, index: number) => {
    setProcessingTx(index)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateTransaction(index, { ...tx, signature: 'signed' })
    } catch (error) {
      console.error('Error signing transaction:', error)
    }
    setProcessingTx(null)
  }

  const handleVerify = async (tx: any, index: number) => {
    setProcessingTx(index)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateTransaction(index, { ...tx, isVerified: true })
    } catch (error) {
      console.error('Error verifying transaction:', error)
    }
    setProcessingTx(null)
  }

  const handleValidate = async (tx: any, index: number) => {
    setProcessingTx(index)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateTransaction(index, { ...tx, isValid: true })
    } catch (error) {
      console.error('Error validating transaction:', error)
    }
    setProcessingTx(null)
  }

  return (
    <div className="space-y-6">
      {/* Transaction Creation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">From Address</label>
            <select
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="" className="bg-white dark:bg-gray-700">Select wallet</option>
              {wallets.map(wallet => (
                <option key={wallet.address} value={wallet.address} className="bg-white dark:bg-gray-700">
                  {wallet.address} ({wallet.balance} BTC)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">To Address</label>
            <select
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="" className="bg-white dark:bg-gray-700">Select wallet</option>
              {wallets.map(wallet => (
                <option key={wallet.address} value={wallet.address} className="bg-white dark:bg-gray-700">
                  {wallet.address} ({wallet.balance} BTC)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Amount (BTC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.00000001"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="0.00000000"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Transaction
          </button>
        </form>
      </div>

      {/* Network Broadcasts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Network Broadcasts
          {pendingTransactions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-300">
              ({pendingTransactions.length} pending)
            </span>
          )}
        </h2>

        {pendingTransactions.length > 0 ? (
          <div className="space-y-4">
            {pendingTransactions.map((tx, index) => (
              <div
                key={`${tx.timestamp}-${tx.from}-${tx.to}`}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 relative"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        From: {tx.from}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">→</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        To: {tx.to}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      Amount: {tx.amount} BTC
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      {/* Transaction Status Indicators */}
                      <div className="flex items-center space-x-4">
                        <span className={`flex items-center ${tx.signature ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <FaCheckCircle className="mr-1" />
                          Signed
                        </span>
                        <span className={`flex items-center ${tx.isVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <FaShieldAlt className="mr-1" />
                          Verified
                        </span>
                        <span className={`flex items-center ${tx.isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <FaCheckCircle className="mr-1" />
                          Valid
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <button
                    onClick={() => cancelTransaction(tx)}
                    className="absolute top-4 right-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="Cancel Transaction"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-300 py-8">
            No pending transactions
          </div>
        )}
      </motion.div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Transaction History</h2>
        <div className="space-y-4">
          {transactionHistory.map((entry, index) => (
            <div
              key={index}
              onClick={() => setSelectedTransaction(entry)}
              className={`p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow ${
                entry.status === 'failed'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : entry.status === 'mined'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">From: {entry.transaction.from}</span>
                    <span className="text-gray-600 dark:text-gray-300">→</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">To: {entry.transaction.to}</span>
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    Amount: {entry.transaction.amount} BTC
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-sm ${
                  entry.status === 'failed'
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                    : entry.status === 'mined'
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                }`}>
                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-2xl w-full mx-4 relative"
            >
              <button
                onClick={() => setSelectedTransaction(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Transaction Details</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">From</div>
                    <div className="font-medium text-gray-900 dark:text-white break-all">
                      {selectedTransaction.transaction.from}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">To</div>
                    <div className="font-medium text-gray-900 dark:text-white break-all">
                      {selectedTransaction.transaction.to}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Amount</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.transaction.amount} BTC
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <div className={`inline-block px-2 py-1 rounded text-sm mt-1 ${
                    selectedTransaction.status === 'failed'
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                      : selectedTransaction.status === 'mined'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                      : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                  }`}>
                    {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Timestamp</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedTransaction.timestamp).toLocaleString()}
                  </div>
                </div>

                {selectedTransaction.transaction.signature && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Signature</div>
                    <div className="font-mono text-xs text-gray-900 dark:text-white break-all bg-gray-100 dark:bg-gray-700 p-2 rounded">
                      {selectedTransaction.transaction.signature}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 mt-2">
                  <div className={`flex items-center ${selectedTransaction.transaction.signature ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <FaCheckCircle className="mr-1" />
                    Signed
                  </div>
                  <div className={`flex items-center ${selectedTransaction.transaction.isVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <FaShieldAlt className="mr-1" />
                    Verified
                  </div>
                  <div className={`flex items-center ${selectedTransaction.transaction.isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <FaCheckCircle className="mr-1" />
                    Valid
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Log */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Activity Log</h2>
        <div className="space-y-2">
          {activityLog.map((entry, index) => (
            <div
              key={index}
              className={`p-2 rounded ${
                entry.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              }`}
            >
              {entry.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}