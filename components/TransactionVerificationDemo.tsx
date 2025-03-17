'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ec as EC } from 'elliptic'
import CryptoJS from 'crypto-js'

const ec = new EC('secp256k1')

interface VerificationStep {
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed'
}

export default function TransactionVerificationDemo() {
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      title: 'Generate Key Pair',
      description: 'Create public and private keys for the sender',
      status: 'pending'
    },
    {
      title: 'Create Transaction',
      description: 'Prepare transaction data to be signed',
      status: 'pending'
    },
    {
      title: 'Sign Transaction',
      description: 'Sign the transaction with sender\'s private key',
      status: 'pending'
    },
    {
      title: 'Verify Signature',
      description: 'Verify the signature using sender\'s public key',
      status: 'pending'
    }
  ])

  const [keyPair, setKeyPair] = useState<{ private: string; public: string } | null>(null)
  const [transaction, setTransaction] = useState<{ data: string; hash: string } | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const updateStep = (index: number, status: VerificationStep['status']) => {
    setSteps(steps.map((step, i) =>
      i === index ? { ...step, status } : step
    ))
  }

  const generateKeyPair = () => {
    updateStep(0, 'active')
    const pair = ec.genKeyPair()
    const keyPair = {
      private: pair.getPrivate('hex'),
      public: pair.getPublic('hex')
    }
    setKeyPair(keyPair)
    updateStep(0, 'completed')
    setCurrentStep(1)
  }

  const createTransaction = () => {
    updateStep(1, 'active')
    const transactionData = {
      from: 'Alice',
      to: 'Bob',
      amount: 50,
      timestamp: Date.now()
    }
    const hash = CryptoJS.SHA256(JSON.stringify(transactionData)).toString()
    setTransaction({ data: JSON.stringify(transactionData, null, 2), hash })
    updateStep(1, 'completed')
    setCurrentStep(2)
  }

  const signTransaction = () => {
    if (!keyPair || !transaction) return
    updateStep(2, 'active')

    const key = ec.keyFromPrivate(keyPair.private)
    const signature = key.sign(transaction.hash).toDER('hex')
    setSignature(signature)
    updateStep(2, 'completed')
    setCurrentStep(3)
  }

  const verifySignature = () => {
    if (!keyPair || !transaction || !signature) return
    updateStep(3, 'active')

    const key = ec.keyFromPublic(keyPair.public, 'hex')
    try {
      const isValid = key.verify(transaction.hash, signature)
      setIsVerified(isValid)
      updateStep(3, isValid ? 'completed' : 'failed')
    } catch (error) {
      setIsVerified(false)
      updateStep(3, 'failed')
    }
  }

  const actions = [
    generateKeyPair,
    createTransaction,
    signTransaction,
    verifySignature
  ]

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Transaction Verification Process</h2>
        <p className="text-gray-300 mb-4">
          See how digital signatures are created and verified in cryptocurrency transactions.
          This demonstration shows the step-by-step process of securing a transaction.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className={`card relative ${
                step.status === 'active' ? 'border-primary' :
                step.status === 'completed' ? 'border-green-500' :
                step.status === 'failed' ? 'border-red-500' :
                'border-gray-700'
              }`}
              initial={false}
              animate={{
                scale: step.status === 'active' ? 1.02 : 1,
                borderWidth: step.status === 'active' ? 2 : 1
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'failed' ? 'bg-red-500' :
                  step.status === 'active' ? 'bg-primary' :
                  'bg-gray-700'
                }`}>
                  {step.status === 'completed' ? '✓' :
                   step.status === 'failed' ? '✗' :
                   index + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>
              {index === currentStep && (
                <button
                  onClick={actions[index]}
                  className="button mt-4 w-full"
                >
                  Execute Step
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          {keyPair && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h3 className="text-xl font-semibold mb-4">Key Pair</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-400">Private Key:</div>
                  <div className="text-xs break-all bg-surface p-2 rounded">
                    {keyPair.private}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Public Key:</div>
                  <div className="text-xs break-all bg-surface p-2 rounded">
                    {keyPair.public}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {transaction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h3 className="text-xl font-semibold mb-4">Transaction Data</h3>
              <div className="space-y-2">
                <div className="text-xs font-mono bg-surface p-2 rounded whitespace-pre">
                  {transaction.data}
                </div>
                <div>
                  <div className="text-sm text-gray-400">Transaction Hash:</div>
                  <div className="text-xs break-all bg-surface p-2 rounded">
                    {transaction.hash}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {signature && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h3 className="text-xl font-semibold mb-4">Digital Signature</h3>
              <div className="text-xs break-all bg-surface p-2 rounded">
                {signature}
              </div>
            </motion.div>
          )}

          {isVerified !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card ${isVerified ? 'border-green-500' : 'border-red-500'}`}
            >
              <h3 className="text-xl font-semibold mb-4">Verification Result</h3>
              <div className={`text-lg ${isVerified ? 'text-green-500' : 'text-red-500'}`}>
                {isVerified ? '✓ Signature Valid' : '✗ Signature Invalid'}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}