'use client'

import { useBlockchain } from '../contexts/BlockchainContext'

export default function MiningControls() {
  const { blockchain, pendingTransactions, difficulty, setDifficulty, isMining, startMining, stopMining, miningSpeed, setMiningSpeed } = useBlockchain()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Mining Control</h2>
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
          onClick={isMining ? stopMining : () => startMining(pendingTransactions)}
          disabled={pendingTransactions.length === 0}
          className={`px-6 py-3 rounded-lg ${
            isMining
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {isMining ? 'Stop Mining' : 'Start Mining'}
        </button>
      </div>
    </div>
  )
}