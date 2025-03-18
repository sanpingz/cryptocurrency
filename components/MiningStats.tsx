'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useBlockchain } from '../contexts/BlockchainContext'

export default function MiningStats() {
  const {
    miningStats,
    isMining,
    difficulty,
    currentMiningBlock
  } = useBlockchain()
  const { hashRate, totalHashes, recentHashes } = miningStats

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Mining Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="p-4 bg-gray-100 rounded"
            animate={{
              backgroundColor: isMining ? ['#f3f4f6', '#e5edff', '#f3f4f6'] : '#f3f4f6'
            }}
            transition={{
              duration: 1,
              repeat: isMining ? Infinity : 0,
              repeatType: "reverse"
            }}
          >
            <div className="text-sm text-gray-900">Hash Rate</div>
            <motion.div
              key={hashRate}
              initial={{ scale: 1.1, color: '#2563eb' }}
              animate={{ scale: 1, color: '#111827' }}
              className="text-2xl font-bold"
            >
              {hashRate.toLocaleString()} H/s
            </motion.div>
          </motion.div>
          <motion.div
            className="p-4 bg-gray-100 rounded"
            animate={{
              backgroundColor: isMining ? ['#f3f4f6', '#e5edff', '#f3f4f6'] : '#f3f4f6'
            }}
            transition={{
              duration: 1,
              repeat: isMining ? Infinity : 0,
              repeatType: "reverse"
            }}
          >
            <div className="text-sm text-gray-900">Total Hashes</div>
            <motion.div
              key={totalHashes}
              initial={{ scale: 1.1, color: '#2563eb' }}
              animate={{ scale: 1, color: '#111827' }}
              className="text-2xl font-bold"
            >
              {totalHashes.toLocaleString()}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Recent Hashes</h3>
        </div>
        <div className="space-y-3">
          {miningStats.recentHashes.map((hashEntry, index) => {
            const leadingZeros = hashEntry.hash.match(/^0*/)?.[0].length || 0
            const isMatch = leadingZeros >= difficulty
            const timestamp = new Date().toLocaleTimeString()

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg ${
                  isMatch ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-mono text-sm break-all text-gray-800">
                    {hashEntry.hash}
                  </div>
                  <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    isMatch ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {leadingZeros} zeros
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <div className="flex items-center space-x-4 text-gray-700">
                    <span className="font-medium">Nonce: {hashEntry.nonce}</span>
                    <span className="font-medium">Time: {timestamp}</span>
                  </div>
                  {isMatch && (
                    <span className="flex items-center text-green-600 font-medium">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Target Match!
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
          {miningStats.recentHashes.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No hashes generated yet
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
      `}</style>
    </div>
  )
}