'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BlockchainVisualizer from '@/components/BlockchainVisualizer'
import MiningControls from '@/components/MiningControls'
import MiningStats from '@/components/MiningStats'
import MinersManagement from '@/components/MinersManagement'
import MiningRewards from '@/components/MiningRewards'
import TransactionProcessDemo from '@/components/TransactionProcessDemo'
import WalletManager from '@/components/WalletManager'
import { BlockchainProvider } from '@/contexts/BlockchainContext'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'mining'>('transactions')

  return (
    <BlockchainProvider>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-4xl font-bold text-center bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent drop-shadow p-2">
              Understanding Cryptocurrency
            </h1>

            <BlockchainVisualizer />

            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 md:p-6">
                <MiningControls />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-col sm:flex-row border-b">
                <button
                  onClick={() => setActiveTab('wallets')}
                  className={`flex-1 px-4 py-3 text-lg font-medium transition-colors ${
                    activeTab === 'wallets'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Wallets
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex-1 px-4 py-3 text-lg font-medium transition-colors ${
                    activeTab === 'transactions'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('mining')}
                  className={`flex-1 px-4 py-3 text-lg font-medium transition-colors ${
                    activeTab === 'mining'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mining
                </button>
              </div>

              <div className="p-4 md:p-6">
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
                      <div className="space-y-6">
                        <MinersManagement />
                        <MiningRewards />
                        <MiningStats />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              Author: Calvin • Version 1.0.0
            </div>
          </div>
        </div>
      </main>
    </BlockchainProvider>
  )
}