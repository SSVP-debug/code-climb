const MAX_CONCURRENT = parseInt(process.env.JUDGE0_MAX_CONCURRENCY || "8", 10);

let activeCount = 0;
const waitQueue = [];

function acquire() {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waitQueue.push(resolve));
}

function release() {
  activeCount--;
  const next = waitQueue.shift();
  if (next) {
    activeCount++;
    next();
  }
}

export async function enqueueExecution(job) {
  await acquire();
  try {
    return await job();
  } finally {
    release();
  }
}