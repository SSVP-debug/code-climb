import { enqueueExecution as directExecution }
  from "./directExecutionQueue.js";

export async function enqueueExecution(job) {
  return directExecution(job);
}