'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ec as EC } from 'elliptic'
import CryptoJS from 'crypto-js'

// Initialize elliptic curve instance
const ec = new EC('secp256k1')

interface Transaction {
  from: string
  to: string
  amount: number
  timestamp: number
  signature?: string
  isVerified?: boolean
}

interface Block {
  index: number
  timestamp: number
  transactions: Transaction[]
  previousHash: string
  hash: string
  nonce: number
}

interface Wallet {
  address: string
  balance: number
  keyPair: {
    private: string
    public: string
  }
}

export default function TransactionToBlockDemo() {
  const [blockchain, setBlockchain] = useState<Block[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedFrom, setSelectedFrom] = useState('')
  const [selectedTo, setSelectedTo] = useState('')
  const [amount, setAmount] = useState('')
  const [miningInProgress, setMiningInProgress] = useState(false)
  const [difficulty] = useState(2) // Number of leading zeros required

  // Initialize wallets and genesis block
  useEffect(() => {
    // Create initial wallets
    const initialWallets = ['Alice', 'Bob', 'Charlie'].map(name => {
      const keyPair = ec.genKeyPair()
      return {
        address: name,
        balance: 100,
        keyPair: {
          private: keyPair.getPrivate('hex'),
          public: keyPair.getPublic('hex')
        }
      }
    })
    setWallets(initialWallets)

    // Create genesis block
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0',
      hash: '',
      nonce: 0
    }
    genesisBlock.hash = calculateBlockHash(genesisBlock)
    setBlockchain([genesisBlock])
  }, [])

  const calculateBlockHash = (block: Block): string => {
    return CryptoJS.SHA256(
      block.index +
      block.timestamp +
      JSON.stringify(block.transactions) +
      block.previousHash +
      block.nonce
    ).toString()
  }

  const signTransaction = (transaction: Omit<Transaction, 'signature'>, privateKey: string): string => {
    const keyPair = ec.keyFromPrivate(privateKey)
    const transactionHash = CryptoJS.SHA256(JSON.stringify(transaction)).toString()
    const signature = keyPair.sign(transactionHash)
    return signature.toDER('hex')
  }

  const verifyTransaction = (transaction: Transaction, publicKey: string): boolean => {
    const keyPair = ec.keyFromPublic(publicKey, 'hex')
    const transactionHash = CryptoJS.SHA256(JSON.stringify({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    })).toString()
    return keyPair.verify(transactionHash, transaction.signature!)
  }

  const handleCreateTransaction = () => {
    const fromWallet = wallets.find(w => w.address === selectedFrom)
    if (!fromWallet || fromWallet.balance < Number(amount)) {
      alert('Insufficient balance!')
      return
    }

    const transaction: Transaction = {
      from: selectedFrom,
      to: selectedTo,
      amount: Number(amount),
      timestamp: Date.now()
    }

    const signature = signTransaction(transaction, fromWallet.keyPair.private)
    const signedTransaction = { ...transaction, signature }

    setPendingTransactions(prev => [...prev, signedTransaction])
    setSelectedFrom('')
    setSelectedTo('')
    setAmount('')
  }

  const mineBlock = async () => {
    if (pendingTransactions.length === 0) {
      alert('No pending transactions to mine!')
      return
    }

    setMiningInProgress(true)
    const previousBlock = blockchain[blockchain.length - 1]
    const newBlock: Block = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      transactions: [...pendingTransactions],
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0
    }

    // Mining process (finding the right nonce)
    while (true) {
      newBlock.hash = calculateBlockHash(newBlock)
      if (newBlock.hash.startsWith('0'.repeat(difficulty))) {
        break
      }
      newBlock.nonce++
    }

    // Update blockchain and clear pending transactions
    setBlockchain(prev => [...prev, newBlock])
    setPendingTransactions([])

    // Update wallet balances
    setWallets(prev => {
      const newWallets = [...prev]
      newBlock.transactions.forEach(tx => {
        const fromWallet = newWallets.find(w => w.address === tx.from)
        const toWallet = newWallets.find(w => w.address === tx.to)
        if (fromWallet) fromWallet.balance -= tx.amount
        if (toWallet) toWallet.balance += tx.amount
      })
      return newWallets
    })

    setMiningInProgress(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Create Transaction</h2>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <select
              value={selectedFrom}
              onChange={(e) => setSelectedFrom(e.target.value)}
              className="flex-1 p-2 border rounded"
            >
              <option value="">From Wallet</option>
              {wallets.map(wallet => (
                <option key={wallet.address} value={wallet.address}>
                  {wallet.address} ({wallet.balance} coins)
                </option>
              ))}
            </select>
            <select
              value={selectedTo}
              onChange={(e) => setSelectedTo(e.target.value)}
              className="flex-1 p-2 border rounded"
            >
              <option value="">To Wallet</option>
              {wallets.map(wallet => (
                <option key={wallet.address} value={wallet.address}>
                  {wallet.address} ({wallet.balance} coins)
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 p-2 border rounded"
            />
          </div>
          <button
            onClick={handleCreateTransaction}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            disabled={!selectedFrom || !selectedTo || !amount}
          >
            Create Transaction
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Pending Transactions</h2>
        <div className="space-y-2">
          {pendingTransactions.map((tx, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded"
            >
              <div className="flex justify-between">
                <span>{tx.from} → {tx.to}</span>
                <span className="font-bold">{tx.amount} coins</span>
              </div>
            </motion.div>
          ))}
          {pendingTransactions.length === 0 && (
            <p className="text-gray-500 text-center">No pending transactions</p>
          )}
        </div>
        <button
          onClick={mineBlock}
          className="w-full mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
          disabled={pendingTransactions.length === 0 || miningInProgress}
        >
          {miningInProgress ? 'Mining...' : 'Mine New Block'}
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Blockchain</h2>
        <div className="space-y-4">
          {blockchain.map((block, index) => (
            <motion.div
              key={block.hash}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 border rounded"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Block #{block.index}</span>
                <span className="text-sm text-gray-500">
                  Nonce: {block.nonce}
                </span>
              </div>
              <div className="text-sm font-mono break-all">
                Hash: {block.hash}
              </div>
              <div className="mt-2">
                <div className="text-sm font-semibold mb-1">
                  Transactions ({block.transactions.length})
                </div>
                {block.transactions.map((tx, txIndex) => (
                  <div key={txIndex} className="text-sm text-gray-600 ml-2">
                    {tx.from} → {tx.to}: {tx.amount} coins
                  </div>
                ))}
                {block.transactions.length === 0 && (
                  <div className="text-sm text-gray-400 ml-2">
                    No transactions in this block
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}