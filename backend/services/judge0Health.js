const health = {
  requests: 0,
  successes: 0,
  failures: 0,
  circuitOpen: false,
  circuitOpenedAt: null,
};

export function getJudge0Health() {
  return {
    ...health,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

export function updateJudge0Health(update) {
  Object.assign(health, update);
}