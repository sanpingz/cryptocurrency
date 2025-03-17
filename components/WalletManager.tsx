'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBlockchain } from '../contexts/BlockchainContext'

export default function WalletManager() {
  const { wallets, addWallet, removeWallet, pendingTransactions, activityLog, addActivityLogEntry } = useBlockchain()
  const [newWalletName, setNewWalletName] = useState('')
  const [newWalletBalance, setNewWalletBalance] = useState('100')
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCreateWallet = () => {
    if (!newWalletName.trim()) return
    const balance = parseFloat(newWalletBalance)
    if (isNaN(balance) || balance < 0) {
      addActivityLogEntry('Invalid balance amount', 'error')
      return
    }
    addWallet(newWalletName.trim(), balance)
    setNewWalletName('')
    setNewWalletBalance('100')
  }

  const handleRemoveWallet = (address: string) => {
    removeWallet(address)
    if (selectedWallet === address) {
      setSelectedWallet(null)
    }
    setShowPrivateKey(null)
  }

  const handleCopyKey = async (key: string, type: 'public' | 'private') => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(`${type}-${key.substring(0, 10)}`)
      addActivityLogEntry(`${type.charAt(0).toUpperCase() + type.slice(1)} key copied to clipboard`, 'success')
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      addActivityLogEntry('Failed to copy key to clipboard', 'error')
    }
  }

  const formatKey = (key: string) => {
    // Format the key in groups of 4 characters
    return key.match(/.{1,4}/g)?.join(' ') || key
  }

  return (
    <div className="space-y-6">
      {/* Create New Wallet section remains unchanged */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg p-6 shadow-md"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Wallet</h3>
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="walletName" className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Name
              </label>
              <input
                id="walletName"
                type="text"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="Enter wallet name"
                className="w-full p-2 border rounded text-gray-900 bg-white"
              />
            </div>
            <div className="w-1/3">
              <label htmlFor="walletBalance" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Balance
              </label>
              <input
                id="walletBalance"
                type="number"
                min="0"
                step="1"
                value={newWalletBalance}
                onChange={(e) => setNewWalletBalance(e.target.value)}
                className="w-full p-2 border rounded text-gray-900 bg-white"
              />
            </div>
          </div>
          <button
            onClick={handleCreateWallet}
            disabled={!newWalletName.trim() || isNaN(parseFloat(newWalletBalance)) || parseFloat(newWalletBalance) < 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Create Wallet
          </button>
        </div>
      </motion.div>

      {/* Wallet List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg p-6 shadow-md"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Wallets
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({wallets.length} total)
          </span>
        </h3>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {wallets.map((wallet) => (
              <motion.div
                key={wallet.address}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded border ${
                  selectedWallet === wallet.address
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                } transition-colors cursor-pointer`}
                onClick={() => setSelectedWallet(
                  selectedWallet === wallet.address ? null : wallet.address
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{wallet.address}</div>
                    <div className="text-sm text-gray-600">Balance: {wallet.balance} coins</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowPrivateKey(
                          showPrivateKey === wallet.address ? null : wallet.address
                        )
                      }}
                      className={`px-3 py-1 text-sm ${
                        showPrivateKey === wallet.address
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      } rounded hover:bg-opacity-80`}
                    >
                      {showPrivateKey === wallet.address ? 'Hide' : 'Show'} Keys
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveWallet(wallet.address)
                      }}
                      disabled={pendingTransactions.some(
                        tx => tx.from === wallet.address || tx.to === wallet.address
                      )}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Expanded Wallet Details */}
                <AnimatePresence>
                  {(selectedWallet === wallet.address || showPrivateKey === wallet.address) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <div className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-medium text-gray-700">Public Key:</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyKey(wallet.keyPair.public, 'public')
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          >
                            {copiedKey === `public-${wallet.keyPair.public.substring(0, 10)}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="font-mono text-xs bg-gray-50 p-3 rounded break-all text-gray-900 border border-gray-200">
                          {formatKey(wallet.keyPair.public)}
                        </div>
                      </div>
                      {showPrivateKey === wallet.address && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-sm border-t pt-3"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-medium text-gray-700">Private Key:</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyKey(wallet.keyPair.private, 'private')
                              }}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              {copiedKey === `private-${wallet.keyPair.private.substring(0, 10)}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <div className="font-mono text-xs bg-red-50 p-3 rounded break-all text-gray-900 border border-red-100">
                            {formatKey(wallet.keyPair.private)}
                          </div>
                          <div className="mt-2 text-xs text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Keep this private key secure! Never share it with anyone.
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
          {wallets.length === 0 && (
            <div className="text-center text-gray-600 py-4">
              No wallets created yet
            </div>
          )}
        </div>
      </motion.div>

      {/* Activity Log section remains unchanged */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Wallet Activity</h3>
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