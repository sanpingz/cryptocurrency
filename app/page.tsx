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
import { useBlockchain } from '@/contexts/BlockchainContext'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'mining'>('transactions')

  return (
    <BlockchainProvider>
      <MainContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </BlockchainProvider>
  )
}

function MainContent({
  activeTab,
  setActiveTab
}: {
  activeTab: 'wallets' | 'transactions' | 'mining'
  setActiveTab: (tab: 'wallets' | 'transactions' | 'mining') => void
}) {
  const { errorMessage, setErrorMessage } = useBlockchain()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <h1 className="text-4xl md:text-4xl font-bold text-center bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent drop-shadow p-2">
            Understanding Cryptocurrency
          </h1>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center text-red-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

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
  )
}