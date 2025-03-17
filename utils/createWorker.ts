export function createMiningWorker() {
  const workerCode = `
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');

    let currentNonce = 0;
    let totalHashesProcessed = 0;
    let lastReportTime = Date.now();
    const REPORT_INTERVAL = 100; // Report every 100ms for more frequent updates

    self.onmessage = function(e) {
      const { block, difficulty, miningSpeed } = e.data;
      const target = '0'.repeat(difficulty);
      let lastHash = '';
      let lastNonce = 0;

      function calculateHash(block) {
        return CryptoJS.SHA256(
          block.index +
          block.timestamp +
          JSON.stringify(block.transactions) +
          (block.data || '') +
          block.previousHash +
          block.nonce
        ).toString();
      }

      function mine() {
        const batchSize = 10000; // Smaller batch size for more frequent updates
        const batchStartTime = Date.now();

        for (let i = 0; i < batchSize; i++) {
          const blockToHash = {
            ...block,
            nonce: currentNonce
          };

          const hash = calculateHash(blockToHash);
          lastHash = hash;
          lastNonce = currentNonce;
          totalHashesProcessed++;

          if (hash.startsWith(target)) {
            self.postMessage({
              nonce: currentNonce,
              hash,
              completed: true,
              hashesProcessed: totalHashesProcessed,
              currentHash: hash,
              currentNonce: currentNonce
            });
            return;
          }

          currentNonce++;
        }

        const currentTime = Date.now();
        if (currentTime - lastReportTime >= REPORT_INTERVAL) {
          // Calculate current hash rate
          const timeElapsed = (currentTime - lastReportTime) / 1000;
          const currentBatchHashRate = Math.floor(batchSize / timeElapsed);

          // Report progress and statistics
          self.postMessage({
            nonce: currentNonce,
            completed: false,
            progress: (currentNonce % 10000000) / 10000000,
            hashesProcessed: totalHashesProcessed,
            currentHash: lastHash,
            currentNonce: lastNonce,
            hashRate: currentBatchHashRate
          });
          lastReportTime = currentTime;
        }

        // Add delay based on mining speed
        if (miningSpeed > 0) {
          setTimeout(mine, miningSpeed);
        } else {
          setTimeout(mine, 0);
        }
      }

      // Start mining
      mine();
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);

  // Clean up the URL when the worker is created
  URL.revokeObjectURL(workerUrl);

  return worker;
}