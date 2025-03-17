'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BlockchainVisualizer from '@/components/BlockchainVisualizer'
import MiningControls from '@/components/MiningControls'
import MiningStats from '@/components/MiningStats'
import TransactionProcessDemo from '@/components/TransactionProcessDemo'
import WalletManager from '@/components/WalletManager'
import { BlockchainProvider } from '@/contexts/BlockchainContext'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'mining'>('wallets')

  return (
    <BlockchainProvider>
      <main className="min-h-screen p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent drop-shadow p-2">
            Understanding Cryptocurrency
          </h1>

          <BlockchainVisualizer />

          <div className="bg-white rounded-lg p-6 shadow-md">
            <MiningControls />
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('wallets')}
                className={`flex-1 px-6 py-3 text-lg font-medium transition-colors ${
                  activeTab === 'wallets'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Wallets
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-6 py-3 text-lg font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('mining')}
                className={`flex-1 px-6 py-3 text-lg font-medium transition-colors ${
                  activeTab === 'mining'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mining
              </button>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'wallets' ? (
                  <motion.div
                    key="wallets"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WalletManager />
                  </motion.div>
                ) : activeTab === 'transactions' ? (
                  <motion.div
                    key="transactions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TransactionProcessDemo />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mining"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MiningStats />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>
    </BlockchainProvider>
  )
}