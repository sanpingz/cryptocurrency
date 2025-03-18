'use client'

import { useState } from 'react'
import { useBlockchain } from '../contexts/BlockchainContext'

export default function MiningRewards() {
  const {
    blockReward,
    transactionFeeRate,
    setBlockReward,
    setTransactionFeeRate,
    calculateTransactionFees,
    pendingTransactions
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
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Mining Rewards</h2>
        <button
          onClick={() => isEditingRewards ? handleSaveRewards() : setIsEditingRewards(true)}
          className="w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditingRewards ? 'Save Changes' : 'Edit Rewards'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">Block Reward:</span>
                {isEditingRewards ? (
                  <input
                    type="number"
                    value={tempBlockReward}
                    onChange={(e) => setTempBlockReward(Math.max(0, Number(e.target.value)))}
                    className="w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-mono"
                    min="0"
                    step="0.5"
                  />
                ) : (
                  <span className="font-mono text-gray-900">{blockReward} BTC</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">Transaction Fee Rate:</span>
                <div className="min-w-[160px] text-right">
                  {isEditingRewards ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={tempFeeRate}
                        onChange={(e) => setTempFeeRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-28 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-mono text-right"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-gray-900 w-4">%</span>
                    </div>
                  ) : (
                    <span className="font-mono text-gray-900">{(transactionFeeRate * 100).toFixed(2)}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded">
            <div className="text-sm font-medium text-gray-900 mb-1">Base Reward</div>
            <div className="text-lg font-mono text-gray-900">{blockReward} BTC</div>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <div className="text-sm font-medium text-gray-900 mb-1">Estimated Fees</div>
            <div className="text-lg font-mono text-gray-900">{estimatedFees.toFixed(8)} BTC</div>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <div className="text-sm font-medium text-gray-900 mb-1">Total Potential Reward</div>
            <div className="text-lg font-mono text-gray-900">{(blockReward + estimatedFees).toFixed(8)} BTC</div>
          </div>
        </div>
      </div>
    </div>
  )
}