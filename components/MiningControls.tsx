'use client'

import { useState } from 'react'
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
    blockReward,
    transactionFeeRate,
    setBlockReward,
    setTransactionFeeRate,
    calculateTransactionFees
  } = useBlockchain()

  const [isEditingRewards, setIsEditingRewards] = useState(false)
  const [tempBlockReward, setTempBlockReward] = useState(blockReward)
  const [tempFeeRate, setTempFeeRate] = useState(transactionFeeRate * 100) // Convert to percentage for display

  const handleSaveRewards = () => {
    setBlockReward(tempBlockReward)
    setTransactionFeeRate(tempFeeRate / 100) // Convert back to decimal
    setIsEditingRewards(false)
  }

  const estimatedFees = calculateTransactionFees(pendingTransactions)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Mining Control</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
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
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Current Miner
          </label>
          <select
            value={currentMiner.address}
            onChange={(e) => setCurrentMiner(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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

      <div className="flex justify-between items-center bg-gray-100 p-4 rounded">
        <div className="text-gray-900">
          <div className="font-semibold mb-1">Mining Rewards</div>
          <div className="space-y-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-28 mb-2">
              <div className="md:max-w-[260px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Block Reward:</span>
                  {isEditingRewards ? (
                    <input
                      type="number"
                      value={tempBlockReward}
                      onChange={(e) => setTempBlockReward(Math.max(0, Number(e.target.value)))}
                      className="w-32 px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-mono"
                      min="0"
                      step="0.5"
                    />
                  ) : (
                    <span className="font-mono">{blockReward} BTC</span>
                  )}
                </div>
              </div>

              <div className="md:max-w-[380px] md:ml-auto">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 shrink-0">Transaction Fee Rate:</span>
                  <div className="min-w-[160px] text-right">
                    {isEditingRewards ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={tempFeeRate}
                          onChange={(e) => setTempFeeRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                          className="w-28 px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-mono text-right"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span className="text-gray-600 w-4">%</span>
                      </div>
                    ) : (
                      <span className="font-mono">{(transactionFeeRate * 100).toFixed(2)}%</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Base Reward:</span>
              <span className="font-mono">{blockReward} BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Fees:</span>
              <span className="font-mono">{estimatedFees.toFixed(8)} BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Potential Reward:</span>
              <span className="font-mono">{(blockReward + estimatedFees).toFixed(8)} BTC</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => isEditingRewards ? handleSaveRewards() : setIsEditingRewards(true)}
          className={`px-6 py-3 rounded-lg ml-4 ${
            isEditingRewards
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap`}
        >
          {isEditingRewards ? 'Save Changes' : 'Edit Rewards'}
        </button>
      </div>

      <div className="flex justify-between items-center bg-gray-100 p-4 rounded">
        <div className="text-gray-900">
          <div className="font-semibold mb-1">Mining Status</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Transactions:</span>
              <span className="font-mono">{pendingTransactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Target Pattern:</span>
              <span className="font-mono">{'0'.repeat(difficulty) + 'x'.repeat(64 - difficulty)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Block:</span>
              <span className="font-mono">#{blockchain.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Miner Balance:</span>
              <span className="font-mono">{currentMiner.balance.toFixed(8)} BTC</span>
            </div>
          </div>
        </div>
        <button
          onClick={isMining ? stopMining : () => startMining(pendingTransactions)}
          disabled={pendingTransactions.length === 0}
          className={`px-6 py-3 rounded-lg ml-4 ${
            isMining
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap`}
        >
          {isMining ? 'Stop Mining' : 'Start Mining'}
        </button>
      </div>
    </div>
  )
}