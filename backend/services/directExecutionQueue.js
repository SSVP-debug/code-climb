export async function enqueueExecution(job) {
  return job();
}