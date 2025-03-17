'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useBlockchain } from '../contexts/BlockchainContext'

interface HashEntry {
  hash: string
  matches: number
  timestamp: number
  nonce: number
}

export default function MiningDemo() {
  const { blockchain, pendingTransactions, addBlock, calculateHash, difficulty, setDifficulty, updateWallets } = useBlockchain()
  const [mining, setMining] = useState(false)
  const miningRef = useRef(false)
  const [miningSpeed, setMiningSpeed] = useState(0) // 0 = fastest, higher = slower
  const [recentHashes, setRecentHashes] = useState<HashEntry[]>([])
  const [hashRate, setHashRate] = useState(0)
  const [totalHashes, setTotalHashes] = useState(0)
  const startTimeRef = useRef<number>(0)
  const hashCountRef = useRef<number>(0)

  const updateHashRate = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    if (elapsed > 0) {
      setHashRate(Math.round(hashCountRef.current / elapsed))
    }
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (mining) {
      miningRef.current = true
      startTimeRef.current = Date.now()
      hashCountRef.current = 0
      intervalId = setInterval(updateHashRate, 1000)
    } else {
      miningRef.current = false
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      miningRef.current = false
    }
  }, [mining, updateHashRate])

  const mine = useCallback(async () => {
    if (pendingTransactions.length === 0) return

    try {
      setMining(true)
      miningRef.current = true
      let nonce = 0
      const previousBlock = blockchain[blockchain.length - 1]
      const newBlock = {
        index: previousBlock.index + 1,
        timestamp: Date.now(),
        transactions: [...pendingTransactions],
        previousHash: previousBlock.hash,
        nonce
      }

      while (miningRef.current) {
        newBlock.nonce = nonce
        const hash = calculateHash(newBlock)
        const matches = hash.match(/^0+/)?.[0].length ?? 0

        hashCountRef.current++
        setTotalHashes(prev => prev + 1)

        setRecentHashes(prev => {
          const updated = [
            { hash, matches, timestamp: Date.now(), nonce },
            ...prev
          ].slice(0, 50)
          return updated
        })

        if (hash.startsWith('0'.repeat(difficulty))) {
          addBlock({
            ...newBlock,
            hash
          })
          updateWallets(pendingTransactions)
          break
        }

        nonce++
        if (miningSpeed > 0) {
          await new Promise(resolve => setTimeout(resolve, miningSpeed))
        } else {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
    } finally {
      setMining(false)
      miningRef.current = false
    }
  }, [pendingTransactions, blockchain, calculateHash, addBlock, difficulty, miningSpeed, updateWallets])

  const stopMining = useCallback(() => {
    miningRef.current = false
    setMining(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Mining Control</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Target Difficulty
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-sm text-gray-900">
                  <span>Easier (2)</span>
                  <span className="font-medium text-blue-700">Current: {difficulty}</span>
                  <span>Harder (8)</span>
                </div>
                <div className="text-sm text-gray-900">
                  Target hash must start with {difficulty} zeros
                  {difficulty >= 6 && (
                    <span className="ml-2 text-red-700 font-medium">
                      (Warning: High difficulty may take longer to mine)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Mining Speed
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={miningSpeed}
                  onChange={(e) => setMiningSpeed(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-sm text-gray-900">
                  <span>Fastest</span>
                  <span className="font-medium text-blue-700">
                    {miningSpeed === 0 ? 'Max Speed' : `${miningSpeed}ms delay`}
                  </span>
                  <span>Slowest</span>
                </div>
                <div className="text-sm text-gray-900">
                  Adjust speed to visualize the mining process
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-100 p-4 rounded">
            <div className="text-gray-900">
              <div className="font-semibold mb-1">Mining Status</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Pending Transactions:</span>
                  <span className="font-mono">{pendingTransactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Pattern:</span>
                  <span className="font-mono">{'0'.repeat(difficulty) + 'x'.repeat(64 - difficulty)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Block:</span>
                  <span className="font-mono">#{blockchain.length}</span>
                </div>
              </div>
            </div>
            <button
              onClick={mining ? stopMining : mine}
              disabled={pendingTransactions.length === 0}
              className={`px-6 py-3 rounded-lg ${
                mining
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {mining ? 'Stop Mining' : 'Start Mining'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Mining Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">
            <div className="text-sm text-gray-900">Hash Rate</div>
            <div className="text-2xl font-bold text-gray-900">{hashRate.toLocaleString()} H/s</div>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <div className="text-sm text-gray-900">Total Hashes</div>
            <div className="text-2xl font-bold text-gray-900">{totalHashes.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Recent Hashes</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {recentHashes.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gray-100 rounded flex items-center space-x-4 hover:bg-gray-200 transition-colors"
            >
              <div className="w-16 text-center">
                <div className="text-sm text-gray-900">Nonce</div>
                <div className="font-mono text-gray-900">{entry.nonce}</div>
              </div>
              <div className="flex-grow">
                <div className="font-mono text-sm break-all">
                  <span className="text-green-700 font-bold">
                    {entry.hash.substring(0, entry.matches)}
                  </span>
                  <span className="text-gray-900">
                    {entry.hash.substring(entry.matches)}
                  </span>
                </div>
              </div>
              <div className="w-16 text-center">
                <div className="text-sm text-gray-900">Zeros</div>
                <div className="font-mono text-gray-900">{entry.matches}</div>
              </div>
            </motion.div>
          ))}
          {recentHashes.length === 0 && (
            <div className="text-center text-gray-900">
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