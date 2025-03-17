'use client'

import { useState } from 'react'
import { useBlockchain } from '../contexts/BlockchainContext'

export default function MinersManager() {
  const { miners, addMiner, removeMiner } = useBlockchain()
  const [newMinerName, setNewMinerName] = useState('')

  const handleAddMiner = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMinerName.trim()) {
      addMiner(newMinerName.trim())
      setNewMinerName('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Miners</h2>
        <form onSubmit={handleAddMiner} className="flex gap-2">
          <input
            type="text"
            value={newMinerName}
            onChange={(e) => setNewMinerName(e.target.value)}
            placeholder="Enter miner name"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!newMinerName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Miner
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {miners.map((miner) => (
          <div
            key={miner.address}
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{miner.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{miner.address}</p>
              </div>
              <button
                onClick={() => removeMiner(miner.address)}
                className="text-red-600 hover:text-red-700"
                title="Remove miner"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance:</span>
                <span className="font-mono text-gray-900">
                  {miner.balance.toFixed(8)} BTC
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}