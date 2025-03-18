'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BlockchainVisualizer from '@/components/BlockchainVisualizer'
import MiningControls from '@/components/MiningControls'
import MiningStats from '@/components/MiningStats'
import MinersManagement from '@/components/MinersManagement'
import MiningRewards from '@/components/MiningRewards'
import TransactionProcess from '@/components/TransactionProcess'
import WalletManager from '@/components/WalletManager'
import { BlockchainProvider } from '@/contexts/BlockchainContext'
import { useBlockchain } from '@/contexts/BlockchainContext'

export default function Home() {
  return (
    <BlockchainProvider>
      <MainContent />
    </BlockchainProvider>
  )
}

function MainContent() {
  const { errorMessage, setErrorMessage, setActiveTab, activeTab } = useBlockchain()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-4xl font-bold text-center bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
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
                type="button"
                onClick={() => setActiveTab('wallets')}
                className={`flex-1 px-4 py-3 text-lg font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'wallets'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600 shadow-inner'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span role="img" aria-label="wallet">👛</span>
                Wallets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-4 py-3 text-lg font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600 shadow-inner'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span role="img" aria-label="transaction">💸</span>
                Transactions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mining')}
                className={`flex-1 px-4 py-3 text-lg font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'mining'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600 shadow-inner'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span role="img" aria-label="mining">⛏️</span>
                Mining
              </button>
            </div>

            <div className="p-6">
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  {errorMessage}
                </div>
              )}

              {activeTab === 'wallets' && <WalletManager />}
              {activeTab === 'transactions' && <TransactionProcess />}
              {activeTab === 'mining' && (
                <div className="space-y-6">
                  <MinersManagement />
                  <MiningRewards />
                  <MiningStats />
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            Author: Calvin • Version 1.2.0
          </div>
        </div>
      </div>
    </main>
  )
}