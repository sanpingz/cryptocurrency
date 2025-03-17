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

interface Miner {
  name: string
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
  miners: Miner[]
  currentMiner: Miner
  errorMessage: string
  setErrorMessage: (message: string) => void
  addBlock: (block: Block) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (index: number, transaction: Transaction) => void
  cancelTransaction: (transaction: Transaction) => void
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
  addMiner: (name: string) => void
  removeMiner: (address: string) => void
  setCurrentMiner: (address: string) => void
  blockReward: number
  transactionFeeRate: number
  setBlockReward: (reward: number) => void
  setTransactionFeeRate: (rate: number) => void
  calculateTransactionFees: (transactions: Transaction[]) => number
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
  const [difficulty, setDifficulty] = useState(5)
  const [isMining, setIsMining] = useState(false)
  const [currentMiningBlock, setCurrentMiningBlock] = useState<Block | null>(null)
  const [miningProgress, setMiningProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
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
    // Initialize with Alice, Bob, and Mark as default wallets
    return ['Alice', 'Bob', 'Mark'].map(name => {
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

  const [miners, setMiners] = useState<Miner[]>(() => {
    // Initialize with Jarvis as default miner
    const keyPair = ec.genKeyPair()
    return [{
      name: 'Jarvis',
      address: 'Jarvis',
      balance: 0,
      keyPair: {
        private: keyPair.getPrivate('hex'),
        public: keyPair.getPublic('hex')
      }
    }]
  })

  const [currentMiner, setCurrentMiner] = useState<Miner>(() => miners[0])

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

  const [blockReward, setBlockReward] = useState(3.125) // Default block reward: 3.125 BTC
  const [transactionFeeRate, setTransactionFeeRate] = useState(0.001) // Default fee rate: 0.1%

  const calculateTransactionFees = (transactions: Transaction[]): number => {
    return transactions.reduce((total, tx) => total + (tx.amount * transactionFeeRate), 0)
  }

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
    if (transactions.length === 0) {
      setErrorMessage('No transactions to mine')
      addActivityLogEntry('No transactions to mine', 'error')
      return
    }

    // First verify signatures for all transactions
    const validTransactions = transactions.filter(tx => {
      if (!tx.signature) {
        setErrorMessage(`Transaction from ${tx.from} to ${tx.to} cannot be mined: missing signature`)
        addActivityLogEntry(
          `Transaction from ${tx.from} to ${tx.to} cannot be mined: missing signature`,
          'error'
        )
        return false
      }

      const isSigned = verifyTransaction(tx)
      if (!isSigned) {
        setErrorMessage(`Transaction from ${tx.from} to ${tx.to} cannot be mined: invalid signature`)
        addActivityLogEntry(
          `Transaction from ${tx.from} to ${tx.to} cannot be mined: invalid signature`,
          'error'
        )
        return false
      }

      // Validate the transaction
      const isValid = validateTransaction(tx)
      if (!isValid) {
        setErrorMessage(`Transaction from ${tx.from} to ${tx.to} cannot be mined: insufficient balance`)
        addActivityLogEntry(
          `Transaction from ${tx.from} to ${tx.to} cannot be mined: insufficient balance`,
          'error'
        )
        return false
      }

      return true
    })

    if (validTransactions.length === 0) {
      setErrorMessage('No valid transactions to mine')
      addActivityLogEntry('No valid transactions to mine', 'error')
      return
    }

    // Clear any previous error messages when starting mining
    setErrorMessage('')

    const lastBlock = blockchain[blockchain.length - 1]
    const newBlock: Block = {
      index: lastBlock.index + 1,
      timestamp: Date.now(),
      transactions: validTransactions,
      previousHash: lastBlock.hash,
      hash: '',
      nonce: 0
    }

    setCurrentMiningBlock(newBlock)
    setIsMining(true)
    setMiningProgress(0)
    addActivityLogEntry(`Started mining block #${newBlock.index} with ${validTransactions.length} transactions`, 'success')
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
    // First check if the transaction is properly signed
    if (!transaction.signature || !verifyTransaction(transaction)) {
      return false
    }

    const fromWallet = wallets.find(w => w.address === transaction.from)
    const toWallet = wallets.find(w => w.address === transaction.to)

    // Basic checks
    if (!fromWallet || !toWallet) return false
    if (transaction.amount <= 0) return false

    // Calculate total amount needed including fee
    const fee = transaction.amount * transactionFeeRate
    const totalAmount = transaction.amount + fee

    // Check if sender has enough balance
    return fromWallet.balance >= totalAmount
  }

  const addTransaction = (transaction: Transaction) => {
    // Find sender's wallet and check balance
    const fromWallet = wallets.find(w => w.address === transaction.from)
    if (!fromWallet) {
      setErrorMessage('Transaction creation failed: sender wallet not found')
      addActivityLogEntry('Transaction creation failed: sender wallet not found', 'error')
      return
    }

    // Calculate total amount needed including fee
    const fee = transaction.amount * transactionFeeRate
    const totalDebit = transaction.amount + fee

    // Check if sender has sufficient balance
    if (fromWallet.balance < totalDebit) {
      setErrorMessage(`Transaction creation failed: insufficient balance (${fromWallet.balance} BTC available, ${totalDebit} BTC needed including ${fee.toFixed(8)} BTC fee)`)
      addActivityLogEntry(
        `Transaction creation failed: insufficient balance (${fromWallet.balance} BTC available, ${totalDebit} BTC needed including ${fee.toFixed(8)} BTC fee)`,
        'error'
      )
      return
    }

    // Create transaction hash
    const transactionHash = CryptoJS.SHA256(JSON.stringify({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    })).toString()

    // Sign with sender's private key
    const keyPair = ec.keyFromPrivate(fromWallet.keyPair.private)
    const signature = keyPair.sign(transactionHash).toDER('hex')

    // Add new transaction to pending with initial state
    const newTransaction = {
      ...transaction,
      signature,
      isVerified: false,
      isValid: false
    }

    setPendingTransactions(prev => [...prev, newTransaction])

    // Add to transaction history with 'created' status
    setTransactionHistory(prev => [
      {
        transaction: newTransaction,
        status: 'created',
        timestamp: Date.now()
      },
      ...prev
    ])

    addActivityLogEntry(
      `Transaction created and signed: ${transaction.amount} coins from ${transaction.from} to ${transaction.to}`,
      'success'
    )
  }

  const updateTransaction = (index: number, transaction: Transaction) => {
    setPendingTransactions(prev => {
      const updated = [...prev]
      const currentTx = updated[index]

      // Update signature status if provided
      if (transaction.signature && transaction.signature !== currentTx.signature) {
        const isSigned = verifyTransaction(transaction)
        if (isSigned) {
          addActivityLogEntry('Transaction signed successfully', 'success')
        } else {
          addActivityLogEntry('Transaction signature verification failed', 'error')
        }
        currentTx.signature = transaction.signature
      }

      // Update verification status if needed
      if (transaction.isVerified !== undefined) {
        const isValid = validateTransaction(transaction)
        if (isValid) {
          currentTx.isVerified = true
          addActivityLogEntry('Transaction verified successfully', 'success')
        } else {
          currentTx.isVerified = false
          addActivityLogEntry('Transaction verification failed: insufficient balance or invalid parameters', 'error')
        }
      }

      // Keep valid status false until mined
      currentTx.isValid = false

      updated[index] = currentTx
      return updated
    })

    // Update transaction history
    setTransactionHistory(prev => {
      const updated = [...prev]
      const txIndex = updated.findIndex(
        tx => tx.transaction.timestamp === transaction.timestamp &&
             tx.transaction.from === transaction.from &&
             tx.transaction.to === transaction.to
      )

      if (txIndex !== -1) {
        let newStatus: TransactionStatus['status']
        let message: string

        if (!transaction.signature) {
          newStatus = 'created'
          message = 'Transaction created'
        } else if (transaction.signature && verifyTransaction(transaction)) {
          if (!validateTransaction(transaction)) {
            newStatus = 'failed'
            message = 'Transaction validation failed: insufficient balance or invalid parameters'
            transaction.isVerified = false // Mark as verification failed
          } else {
            const fromWallet = wallets.find(w => w.address === transaction.from)
            const fee = transaction.amount * transactionFeeRate
            const totalDebit = transaction.amount + fee

            // Double check if balance would be sufficient
            if (fromWallet && fromWallet.balance >= totalDebit) {
              newStatus = 'verified'
              message = 'Transaction verified and ready for mining'
            } else {
              newStatus = 'failed'
              message = 'Transaction verification failed: insufficient balance'
              transaction.isVerified = false // Mark as verification failed
            }
          }
        } else {
          newStatus = 'failed'
          message = 'Transaction signature verification failed'
        }

        updated[txIndex] = {
          transaction: {
            ...transaction,
            isVerified: newStatus === 'verified',
            isValid: false // Only set to true when mined
          },
          status: newStatus,
          timestamp: Date.now()
        }

        addActivityLogEntry(message, newStatus === 'failed' ? 'error' : 'success')
      }
      return updated
    })
  }

  const addBlock = (block: Block) => {
    // First validate that all transactions in the block won't cause negative balances
    const walletBalances = new Map(wallets.map(w => [w.address, w.balance]))

    // Check if any transaction would cause negative balance
    for (const tx of block.transactions) {
      const fromBalance = walletBalances.get(tx.from) || 0
      const fee = tx.amount * transactionFeeRate
      const totalDebit = tx.amount + fee

      if (fromBalance < totalDebit) {
        setErrorMessage(`Cannot confirm block: transaction from ${tx.from} would cause negative balance`)
        addActivityLogEntry(
          `[Block ${block.index}] Cannot confirm block: transaction from ${tx.from} would cause negative balance`,
          'error'
        )
        return // Exit without adding block
      }

      // Update temporary balance map
      walletBalances.set(tx.from, fromBalance - totalDebit)
      walletBalances.set(tx.to, (walletBalances.get(tx.to) || 0) + tx.amount)
    }

    // Create the new block
    const newBlock: Block = {
      ...block,
      hash: calculateHash(block)
    }

    // Add the block to the blockchain first
    setBlockchain(prev => [...prev, newBlock])

    // Remove processed transactions from pending first
    setPendingTransactions(prev =>
      prev.filter(tx =>
        !block.transactions.some(
          processedTx =>
            processedTx.timestamp === tx.timestamp &&
            processedTx.from === tx.from &&
            processedTx.to === tx.to
        )
      )
    )

    // Update transaction history
    setTransactionHistory(prev => {
      const updated = [...prev]
      block.transactions.forEach(tx => {
        const txIndex = updated.findIndex(
          t => t.transaction.timestamp === tx.timestamp &&
               t.transaction.from === tx.from &&
               t.transaction.to === tx.to
        )

        if (txIndex !== -1) {
          updated[txIndex] = {
            transaction: {
              ...tx,
              isVerified: true,
              isValid: true
            },
            status: 'mined',
            timestamp: Date.now()
          }
        }
      })
      return updated
    })

    // Update wallet balances in a separate operation
    if (block.transactions.length > 0) {
      const processedTxs = new Set()

      setWallets(prevWallets => {
        const updatedWallets = [...prevWallets]

        block.transactions.forEach(tx => {
          const txId = `${tx.timestamp}-${tx.from}-${tx.to}`
          if (processedTxs.has(txId)) {
            return
          }

          const fromWallet = updatedWallets.find(w => w.address === tx.from)
          const toWallet = updatedWallets.find(w => w.address === tx.to)

          if (fromWallet && toWallet) {
            const fee = tx.amount * transactionFeeRate
            const totalDebit = tx.amount + fee

            fromWallet.balance -= totalDebit
            toWallet.balance += tx.amount
            processedTxs.add(txId)

            addActivityLogEntry(
              `[Block ${block.index}] Transaction completed: ${tx.from} sent ${tx.amount} coins to ${tx.to} (+ ${fee.toFixed(8)} fee)`,
              'success'
            )
          }
        })

        return updatedWallets
      })
    }

    // Calculate and distribute mining rewards
    const fees = calculateTransactionFees(block.transactions)
    const totalReward = blockReward + fees

    setMiners(prev => prev.map(miner =>
      miner.address === currentMiner.address
        ? { ...miner, balance: miner.balance + totalReward }
        : miner
    ))

    setCurrentMiner(prev => ({
      ...prev,
      balance: prev.balance + totalReward
    }))

    // Add mining success messages
    addActivityLogEntry(`[Block ${block.index}] Block mined successfully!`, 'success')
    if (block.transactions.length > 0) {
      addActivityLogEntry(
        `[Block ${block.index}] Miner ${currentMiner.name} received ${blockReward} BTC block reward + ${fees.toFixed(8)} BTC in fees`,
        'success'
      )
    }
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

  const addMiner = (name: string) => {
    const keyPair = ec.genKeyPair()
    const newMiner: Miner = {
      name,
      address: name,
      balance: 0,
      keyPair: {
        private: keyPair.getPrivate('hex'),
        public: keyPair.getPublic('hex')
      }
    }
    setMiners(prev => [...prev, newMiner])
    addActivityLogEntry(`Added new miner: ${name}`, 'success')
  }

  const removeMiner = (address: string) => {
    if (miners.length === 1) {
      addActivityLogEntry('Cannot remove the last miner', 'error')
      return
    }
    if (currentMiner.address === address) {
      const remainingMiners = miners.filter(m => m.address !== address)
      setCurrentMiner(remainingMiners[0])
    }
    setMiners(prev => prev.filter(m => m.address !== address))
    addActivityLogEntry(`Removed miner: ${address}`, 'success')
  }

  const handleMinerChange = (address: string) => {
    const miner = miners.find(m => m.address === address)
    if (miner) {
      setCurrentMiner(miner)
      addActivityLogEntry(`Switched to miner: ${miner.name}`, 'success')
    }
  }

  const cancelTransaction = (transaction: Transaction) => {
    // Check if transaction is in pending state and not in current mining block
    const isInMining = currentMiningBlock?.transactions.some(
      tx => tx.timestamp === transaction.timestamp &&
           tx.from === transaction.from &&
           tx.to === transaction.to
    )

    if (isInMining) {
      addActivityLogEntry(
        'Cannot cancel transaction: it is currently being mined',
        'error'
      )
      return
    }

    // Remove from pending transactions
    setPendingTransactions(prev =>
      prev.filter(tx =>
        !(tx.timestamp === transaction.timestamp &&
          tx.from === transaction.from &&
          tx.to === transaction.to)
      )
    )

    // Update transaction history
    setTransactionHistory(prev => {
      const updated = [...prev]
      const txIndex = updated.findIndex(
        tx => tx.transaction.timestamp === transaction.timestamp &&
             tx.transaction.from === transaction.from &&
             tx.transaction.to === transaction.to
      )

      if (txIndex !== -1) {
        updated[txIndex] = {
          transaction: {
            ...transaction,
            isVerified: false,
            isValid: false
          },
          status: 'failed',
          timestamp: Date.now()
        }
      }
      return updated
    })

    addActivityLogEntry(
      `Transaction cancelled: ${transaction.amount} coins from ${transaction.from} to ${transaction.to}`,
      'success'
    )

    // Stop mining if no valid transactions left
    const remainingValidTransactions = pendingTransactions.filter(tx =>
      tx.timestamp !== transaction.timestamp &&
      tx.isVerified &&
      validateTransaction(tx)
    )

    if (remainingValidTransactions.length === 0) {
      stopMining()
      addActivityLogEntry('Mining stopped: no valid transactions remaining', 'success')
    }
  }

  const updateWallets = (transactions: Transaction[]) => {
    // This function is now a no-op as all wallet updates happen automatically when blocks are mined
    console.warn('updateWallets is deprecated - wallet updates now happen automatically when blocks are mined')
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
    miners,
    currentMiner,
    errorMessage,
    setErrorMessage,
    addBlock,
    addTransaction,
    updateTransaction,
    cancelTransaction,
    calculateHash,
    setDifficulty,
    setMiningSpeed,
    updateWallets,
    startMining,
    stopMining,
    setMiningProgress,
    addActivityLogEntry,
    addWallet,
    removeWallet,
    addMiner,
    removeMiner,
    setCurrentMiner: handleMinerChange,
    blockReward,
    transactionFeeRate,
    setBlockReward,
    setTransactionFeeRate,
    calculateTransactionFees
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