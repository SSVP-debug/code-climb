export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB");
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString("en-GB");
}

export function formatRuntime(ms) {
  if (!ms) return "0 ms";

  const num = Number(ms);

  if (Number.isNaN(num)) {
    return String(ms);
  }

  if (num < 1000) {
    return `${num.toFixed(2)} ms`;
  }

  return `${(num / 1000).toFixed(2)} s`;
}

export function formatMemory(memory) {
  if (!memory) return "0 KB";

  return `${memory} KB`;
}