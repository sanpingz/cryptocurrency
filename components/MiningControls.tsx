'use client'

import { useState, useEffect } from 'react'
import { useBlockchain } from '../contexts/BlockchainContext'

export default function MiningControls() {
  const {
    blockchain,
    pendingTransactions,
    difficulty,
    setDifficulty,
    isMining,
    startMining,
    stopMining,
    miningSpeed,
    setMiningSpeed,
    miners,
    currentMiner,
    setCurrentMiner,
    errorMessage,
    setErrorMessage,
  } = useBlockchain()

  // Determine if on mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const patternLength = isMobile ? 32 : 64

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Mining Control</h2>
        <button
          onClick={isMining ? stopMining : () => startMining(pendingTransactions)}
          disabled={pendingTransactions.length === 0}
          className={`w-full sm:w-auto px-4 py-2 rounded ${
            isMining ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap`}
        >
          {isMining ? 'Stop Mining' : 'Start Mining'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Target Difficulty
          </label>
          <div className="space-y-1.5">
            <input
              type="range"
              min="2"
              max="10"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex flex-wrap justify-between text-sm text-gray-900 gap-2">
              <span>Easier (2)</span>
              <span className="font-medium text-blue-700">Current: {difficulty}</span>
              <span>Harder (10)</span>
            </div>
            <div className="text-sm text-gray-900">
              Target hash must start with {difficulty} zeros
              {difficulty >= 7 && (
                <span className="block mt-1 text-red-700 font-medium">
                  (Warning: High difficulty may take longer to mine)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-3 rounded shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Mining Speed
          </label>
          <div className="space-y-1.5">
            <input
              type="range"
              min="0"
              max="100"
              value={miningSpeed}
              onChange={(e) => setMiningSpeed(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex flex-wrap justify-between text-sm text-gray-900 gap-2">
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

        <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Current Miner
          </label>
          <select
            value={currentMiner.address}
            onChange={(e) => setCurrentMiner(e.target.value)}
            className="w-full p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            {miners.map((miner) => (
              <option
                key={miner.address}
                value={miner.address}
                className="text-gray-900 bg-white"
              >
                {miner.name} ({miner.balance.toFixed(8)} BTC)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mining Status Section */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-3 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="text-gray-900 flex-grow w-full">
            <div className="font-semibold mb-1.5">Mining Status</div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-900">Pending Transactions:</span>
                <span className="font-mono text-gray-900">{pendingTransactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Target Pattern:</span>
                <span className="font-mono text-gray-900 break-all">
                  {'0'.repeat(difficulty) + 'x'.repeat(patternLength - difficulty)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Current Block:</span>
                <span className="font-mono text-gray-900">#{blockchain.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Current Miner Balance:</span>
                <span className="font-mono text-gray-900">{currentMiner.balance.toFixed(8)} BTC</span>
              </div>
            </div>
          </div>
          {isMining && (
            <div className="flex items-center text-blue-600 sm:ml-4">
              <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Mining in Progress
            </div>
          )}
        </div>
      </div>
    </div>
  )
}