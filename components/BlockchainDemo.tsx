'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CryptoJS from 'crypto-js'

interface Block {
  index: number
  timestamp: number
  data: string
  previousHash: string
  hash: string
}

export default function BlockchainDemo() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [newBlockData, setNewBlockData] = useState('')

  const calculateHash = (index: number, timestamp: number, data: string, previousHash: string) => {
    return CryptoJS.SHA256(index + timestamp + data + previousHash).toString()
  }

  const createGenesisBlock = () => {
    const block = {
      index: 0,
      timestamp: Date.now(),
      data: 'Genesis Block',
      previousHash: '0',
      hash: '',
    }
    block.hash = calculateHash(block.index, block.timestamp, block.data, block.previousHash)
    return block
  }

  const createNewBlock = (data: string) => {
    const previousBlock = blocks[blocks.length - 1]
    const newBlock = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      data: data,
      previousHash: previousBlock.hash,
      hash: '',
    }
    newBlock.hash = calculateHash(newBlock.index, newBlock.timestamp, newBlock.data, newBlock.previousHash)
    return newBlock
  }

  useEffect(() => {
    setBlocks([createGenesisBlock()])
  }, [])

  const handleAddBlock = () => {
    if (newBlockData.trim()) {
      const newBlock = createNewBlock(newBlockData)
      setBlocks([...blocks, newBlock])
      setNewBlockData('')
    }
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Blockchain Visualization</h2>
        <p className="text-gray-300 mb-4">
          Each block contains data, a timestamp, and a hash of the previous block,
          forming a chain that cannot be altered without changing all subsequent blocks.
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={newBlockData}
          onChange={(e) => setNewBlockData(e.target.value)}
          placeholder="Enter block data..."
          className="flex-1 px-4 py-2 rounded-md bg-surface text-white border border-gray-700 focus:outline-none focus:border-primary"
        />
        <button onClick={handleAddBlock} className="button">
          Add Block
        </button>
      </div>

      <div className="grid gap-4">
        {blocks.map((block, index) => (
          <motion.div
            key={block.hash}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card relative"
          >
            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              {block.index}
            </div>
            <div className="ml-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-400">
                  {new Date(block.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="mb-2">
                <strong>Data:</strong> {block.data}
              </div>
              <div className="text-sm text-gray-400 break-all">
                <strong>Hash:</strong> {block.hash}
              </div>
              <div className="text-sm text-gray-400 break-all">
                <strong>Previous Hash:</strong> {block.previousHash}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}