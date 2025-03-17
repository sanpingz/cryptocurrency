'use client'

import { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react'
import CryptoJS from 'crypto-js'
import { createMiningWorker } from '../utils/createWorker'
import { ec as EC } from 'elliptic'

// Initialize elliptic curve instance
const ec = new EC('secp256k1')

export interface Transaction {
  from: string
  to: string
  amount: number
  timestamp: number
  signature?: string
  isVerified?: boolean
  isValid?: boolean
}

interface Block {
  index: number
  timestamp: number
  transactions: Transaction[]
  data?: string
  previousHash: string
  hash: string
  nonce: number
}

export interface MiningStats {
  hashRate: number
  totalHashes: number
  startTime: number
  recentHashes: Array<{
    hash: string
    nonce: number
  }>
}

export interface TransactionStatus {
  transaction: Transaction
  status: 'created' | 'broadcast' | 'verified' | 'mined' | 'failed'
  timestamp: number
}

interface ActivityLogEntry {
  message: string
  status: 'success' | 'error' | null
  timestamp: number
}

interface Wallet {
  address: string
  balance: number
  keyPair: {
    private: string
    public: string
  }
}

export interface BlockchainContextType {
  blockchain: Block[]
  pendingTransactions: Transaction[]
  difficulty: number
  isMining: boolean
  currentMiningBlock: Block | null
  miningProgress: number
  miningStats: MiningStats
  miningSpeed: number
  transactionHistory: TransactionStatus[]
  activityLog: ActivityLogEntry[]
  wallets: Wallet[]
  addBlock: (block: Block) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (index: number, transaction: Transaction) => void
  calculateHash: (block: Omit<Block, 'hash'>) => string
  setDifficulty: (difficulty: number) => void
  setMiningSpeed: (speed: number) => void
  updateWallets: (transactions: Transaction[]) => void
  startMining: (transactions: Transaction[]) => void
  stopMining: () => void
  setMiningProgress: (progress: number) => void
  addActivityLogEntry: (message: string, status: 'success' | 'error' | null) => void
  addWallet: (name: string, initialBalance?: number) => void
  removeWallet: (address: string) => void
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined)

// Use a fixed timestamp for the genesis block
const GENESIS_TIMESTAMP = 1609459200000 // 2021-01-01 00:00:00 UTC

// Move calculateHash function before it's used
const calculateHash = (block: Omit<Block, 'hash'>): string => {
  return CryptoJS.SHA256(
    block.index +
    block.timestamp +
    JSON.stringify(block.transactions) +
    (block.data || '') +
    block.previousHash +
    block.nonce
  ).toString()
}

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [blockchain, setBlockchain] = useState<Block[]>(() => {
    const genesisBlock: Block = {
      index: 0,
      timestamp: GENESIS_TIMESTAMP,
      transactions: [],
      data: 'Genesis Block',
      previousHash: '0',
      hash: '',
      nonce: 0
    }
    genesisBlock.hash = calculateHash(genesisBlock)
    return [genesisBlock]
  })

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [difficulty, setDifficulty] = useState(4)
  const [isMining, setIsMining] = useState(false)
  const [currentMiningBlock, setCurrentMiningBlock] = useState<Block | null>(null)
  const [miningProgress, setMiningProgress] = useState(0)
  const workerRef = useRef<Worker | null>(null)

  const [miningStats, setMiningStats] = useState<MiningStats>({
    hashRate: 0,
    totalHashes: 0,
    startTime: 0,
    recentHashes: []
  })

  const [miningSpeed, setMiningSpeed] = useState(0)
  const [transactionHistory, setTransactionHistory] = useState<TransactionStatus[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    // Initialize with Alice and Bob as default wallets
    return ['Alice', 'Bob'].map(name => {
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
  })

  // Keep track of mining session
  const miningSessionRef = useRef<{
    block: Block | null;
    startTime: number;
    totalHashes: number;
    recentHashes: string[];
  }>({
    block: null,
    startTime: 0,
    totalHashes: 0,
    recentHashes: []
  });

  // Initialize or reinitialize the worker
  const initializeWorker = (block: Block) => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }

    // Update mining session reference
    miningSessionRef.current = {
      block,
      startTime: Date.now(),
      totalHashes: 0, // Reset total hashes when starting new block
      recentHashes: []
    };

    const worker = createMiningWorker()
    worker.onmessage = (e) => {
      const { nonce, hash, completed, progress, hashesProcessed, currentHash, currentNonce, hashRate: currentHashRate } = e.data

      // Update mining statistics using the session reference
      setMiningStats(prev => {
        // Keep last 5 hashes
        const recentHashes = [...prev.recentHashes]
        if (currentHash && !recentHashes.some(h => h.hash === currentHash)) {
          recentHashes.unshift({
            hash: currentHash,
            nonce: currentNonce
          })
          if (recentHashes.length > 5) recentHashes.pop()
        }

        return {
          hashRate: currentHashRate || prev.hashRate,
          totalHashes: hashesProcessed,
          startTime: miningSessionRef.current.startTime,
          recentHashes
        }
      })

      if (completed) {
        const minedBlock = {
          ...block,
          nonce,
          hash
        }
        addBlock(minedBlock)
        setIsMining(false)
        setCurrentMiningBlock(null)
        setMiningProgress(1)
        worker.terminate()
        workerRef.current = null
        // Reset mining session
        miningSessionRef.current = {
          block: null,
          startTime: 0,
          totalHashes: 0,
          recentHashes: []
        };
      } else {
        setMiningProgress(progress)
      }
    }

    workerRef.current = worker
    worker.postMessage({ block, difficulty, miningSpeed })
  }

  // Effect to manage worker lifecycle
  useEffect(() => {
    if (isMining && currentMiningBlock) {
      // Only initialize if we don't have a worker or if the block changed
      if (!workerRef.current || miningSessionRef.current.block?.index !== currentMiningBlock.index) {
        initializeWorker(currentMiningBlock)
      }
    }

    return () => {
      // Only cleanup if we're explicitly stopping mining
      if (!isMining && workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [isMining, currentMiningBlock, difficulty])

  const startMining = (transactions: Transaction[]) => {
    // Only mine transactions that are signed
    const signedTransactions = transactions.filter(tx => tx.signature);

    // Don't start mining if no signed transactions
    if (signedTransactions.length === 0) {
      console.warn('No signed transactions to mine');
      return;
    }

    const lastBlock = blockchain[blockchain.length - 1]
    const newBlock: Block = {
      index: lastBlock.index + 1,
      timestamp: Date.now(),
      transactions: signedTransactions,
      previousHash: lastBlock.hash,
      hash: '',
      nonce: 0
    }

    setCurrentMiningBlock(newBlock)
    setIsMining(true)
    setMiningProgress(0)
  }

  const verifyTransaction = (transaction: Transaction): boolean => {
    try {
      const fromWallet = wallets.find(w => w.address === transaction.from)
      if (!fromWallet) return false

      const keyPair = ec.keyFromPublic(fromWallet.keyPair.public, 'hex')
      const transactionHash = CryptoJS.SHA256(JSON.stringify({
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        timestamp: transaction.timestamp
      })).toString()
      return keyPair.verify(transactionHash, transaction.signature!)
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  const validateTransaction = (transaction: Transaction): boolean => {
    const fromWallet = wallets.find(w => w.address === transaction.from)
    return !!(fromWallet && fromWallet.balance >= transaction.amount)
  }

  const addBlock = (block: Block) => {
    // Verify and validate all transactions in the block
    const verifiedTransactions = block.transactions.map(tx => ({
      ...tx,
      isVerified: verifyTransaction(tx),
      isValid: validateTransaction(tx)
    }))

    // Only include transactions that are both verified and valid
    const confirmedTransactions = verifiedTransactions.filter(tx => tx.isVerified && tx.isValid)

    // Create the new block with confirmed transactions
    const newBlock: Block = {
      ...block,
      transactions: confirmedTransactions,
      hash: calculateHash(block)
    }

    // Add the block to the blockchain
    setBlockchain(prev => [...prev, newBlock])

    // Update transaction history for all transactions
    setTransactionHistory(prev => {
      const updated = [...prev]
      verifiedTransactions.forEach(tx => {
        const status: TransactionStatus['status'] = tx.isVerified && tx.isValid ? 'mined' : 'failed'
        const message = tx.isVerified && tx.isValid
          ? `Transaction mined successfully`
          : `Transaction failed: ${!tx.isVerified ? 'verification failed' : 'validation failed'}`

        const txIndex = updated.findIndex(
          t => t.transaction.timestamp === tx.timestamp &&
               t.transaction.from === tx.from &&
               t.transaction.to === tx.to
        )

        if (txIndex !== -1) {
          updated[txIndex] = {
            ...updated[txIndex],
            status,
            timestamp: Date.now()
          }
        }

        // Add activity log entry
        addActivityLogEntry(message, status === 'mined' ? 'success' : 'error')
      })
      return updated
    })

    // Update wallet balances only for confirmed transactions
    updateWallets(confirmedTransactions)

    // Clear all pending transactions
    setPendingTransactions([])

    // Add success message for block
    addActivityLogEntry(`Block #${block.index} mined successfully!`, 'success')
  }

  const addTransaction = (transaction: Transaction) => {
    // Add new transaction with verification flags set to false
    setPendingTransactions(prev => [...prev, {
      ...transaction,
      isVerified: false,
      isValid: false
    }])

    // Add to transaction history
    setTransactionHistory(prev => [
      {
        transaction,
        status: 'created',
        timestamp: Date.now()
      },
      ...prev
    ])

    addActivityLogEntry('Transaction created and signed successfully!', 'success')
  }

  const updateTransaction = (index: number, transaction: Transaction) => {
    setPendingTransactions(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        ...transaction,
        isVerified: transaction.isVerified ?? updated[index].isVerified,
        isValid: transaction.isValid ?? updated[index].isValid
      }
      return updated
    })

    // Update transaction history status
    if (transaction.isVerified && transaction.isValid) {
      setTransactionHistory(prev => {
        const updated = [...prev]
        const txIndex = updated.findIndex(
          tx => tx.transaction.timestamp === transaction.timestamp &&
               tx.transaction.from === transaction.from &&
               tx.transaction.to === transaction.to
        )
        if (txIndex !== -1) {
          updated[txIndex] = {
            ...updated[txIndex],
            status: 'verified',
            timestamp: Date.now()
          }
        }
        return updated
      })
      addActivityLogEntry('Transaction verified successfully!', 'success')
    }
  }

  const updateWallets = (transactions: Transaction[]) => {
    setWallets(prev => {
      const updated = [...prev]
      transactions.forEach(tx => {
        const fromWallet = updated.find(w => w.address === tx.from)
        const toWallet = updated.find(w => w.address === tx.to)
        if (fromWallet) {
          fromWallet.balance -= tx.amount
          addActivityLogEntry(`${fromWallet.address} sent ${tx.amount} coins`, 'success')
        }
        if (toWallet) {
          toWallet.balance += tx.amount
          addActivityLogEntry(`${toWallet.address} received ${tx.amount} coins`, 'success')
        }
      })
      return updated
    })
  }

  const stopMining = () => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setIsMining(false)
    setCurrentMiningBlock(null)
    setMiningProgress(0)
    // Reset mining session
    miningSessionRef.current = {
      block: null,
      startTime: 0,
      totalHashes: 0,
      recentHashes: []
    };
  }

  const addActivityLogEntry = (message: string, status: 'success' | 'error' | null) => {
    setActivityLog(prev => [
      {
        message,
        status,
        timestamp: Date.now()
      },
      ...prev
    ])
  }

  const addWallet = (name: string, initialBalance: number = 100) => {
    const existingWallet = wallets.find(w => w.address === name)
    if (existingWallet) {
      addActivityLogEntry(`Wallet "${name}" already exists!`, 'error')
      return
    }

    const keyPair = ec.genKeyPair()
    const newWallet: Wallet = {
      address: name,
      balance: initialBalance,
      keyPair: {
        private: keyPair.getPrivate('hex'),
        public: keyPair.getPublic('hex')
      }
    }

    setWallets(prev => [...prev, newWallet])
    addActivityLogEntry(`Wallet "${name}" created successfully!`, 'success')
  }

  const removeWallet = (address: string) => {
    const wallet = wallets.find(w => w.address === address)
    if (!wallet) {
      addActivityLogEntry(`Wallet "${address}" not found!`, 'error')
      return
    }

    if (pendingTransactions.some(tx => tx.from === address || tx.to === address)) {
      addActivityLogEntry(`Cannot remove wallet "${address}" - it has pending transactions!`, 'error')
      return
    }

    setWallets(prev => prev.filter(w => w.address !== address))
    addActivityLogEntry(`Wallet "${address}" removed successfully!`, 'success')
  }

  const value = {
    blockchain,
    pendingTransactions,
    difficulty,
    isMining,
    currentMiningBlock,
    miningProgress,
    miningStats,
    miningSpeed,
    transactionHistory,
    activityLog,
    wallets,
    addBlock,
    addTransaction,
    updateTransaction,
    calculateHash,
    setDifficulty,
    setMiningSpeed,
    updateWallets,
    startMining,
    stopMining,
    setMiningProgress,
    addActivityLogEntry,
    addWallet,
    removeWallet
  }

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  )
}

export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider')
  }
  return context
}

// Add helper function to check if a transaction is ready for mining
const isTransactionReadyForMining = (transaction: Transaction): boolean => {
  return !!(transaction.signature && transaction.isVerified && transaction.isValid);
}