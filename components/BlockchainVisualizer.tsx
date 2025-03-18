'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBlockchain } from '../contexts/BlockchainContext'
import { FaTimes } from 'react-icons/fa'

interface Block {
  index: number
  timestamp: number
  transactions: Array<{
    from: string
    to: string
    amount: number
  }>
  data?: string
  previousHash: string
  hash: string
  nonce: number
}

export default function BlockchainVisualizer() {
  const {
    blockchain,
    pendingTransactions,
    difficulty,
    isMining,
    currentMiningBlock,
    miningProgress,
    miningStats
  } = useBlockchain()

  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Current Blockchain</h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{blockchain.length}</div>
                <div className="text-xs text-gray-600">Chain Height</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{difficulty}</div>
                <div className="text-xs text-gray-600">Mining Difficulty</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{pendingTransactions.length}</div>
                <div className="text-xs text-gray-600">Pending Tx</div>
              </div>
            </div>
            <div className="hidden sm:flex bg-gray-100 px-4 py-2 rounded flex-wrap items-center gap-4">
              <div className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Chain Verified
              </div>
              {isMining && (
                <div className="space-y-1 text-sm flex-grow">
                  <div className="flex items-center text-blue-600">
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="whitespace-nowrap">Mining Block #{currentMiningBlock?.index}</span>
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
                onClick={() => setSelectedBlock(block)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedBlock(block)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Block ${block.index} details`}
                className="flex-shrink-0 w-80 p-4 border-2 border-blue-200 rounded-lg bg-blue-50 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
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

      {/* Block Details Modal */}
      <AnimatePresence>
        {selectedBlock && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 shadow-xl max-w-2xl w-full mx-4 relative"
            >
              <button
                onClick={() => setSelectedBlock(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close block details"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              <h3 id="modal-title" className="text-xl font-bold text-gray-900 mb-6">Block Details</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Block Number</div>
                  <div className="font-medium text-gray-900">
                    #{selectedBlock.index}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Timestamp</div>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedBlock.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Nonce</div>
                  <div className="font-medium text-gray-900">
                    {selectedBlock.nonce}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Previous Hash</div>
                  <div className="font-mono text-xs text-gray-900 break-all bg-gray-100 p-2 rounded">
                    {selectedBlock.previousHash}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Block Hash</div>
                  <div className="font-mono text-xs text-gray-900 break-all bg-gray-100 p-2 rounded">
                    {selectedBlock.hash}
                  </div>
                </div>

                {selectedBlock.data && (
                  <div>
                    <div className="text-sm text-gray-500">Block Data</div>
                    <div className="font-medium text-gray-900">
                      {selectedBlock.data}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-500 mb-2">Transactions</div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    {selectedBlock.transactions.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBlock.transactions.map((tx, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">From: {tx.from}</span>
                              <span className="text-gray-600">→</span>
                              <span className="font-medium text-gray-900">To: {tx.to}</span>
                            </div>
                            <div className="text-sm text-gray-800">
                              Amount: {tx.amount} coins
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No transactions in this block
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}