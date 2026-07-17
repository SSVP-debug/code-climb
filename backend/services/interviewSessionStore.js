// Simple in-memory interview session store.
// Can later be replaced with Redis without changing the route API.

const sessions = new Map();

export async function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}

export async function setSession(sessionId, session, ttlSeconds = 0) {
  sessions.set(sessionId, session);

  if (ttlSeconds > 0) {
    setTimeout(() => {
      const current = sessions.get(sessionId);
      if (
        current &&
        Date.now() >= current.expiresAt + 60 * 60 * 1000 // 1 hour grace
      ) {
        sessions.delete(sessionId);
      }
    }, ttlSeconds * 1000);
  }

  return session;
}

export function sweepExpiredMemorySessions() {
  const now = Date.now();

  for (const [id, session] of sessions.entries()) {
    if (now >= session.expiresAt + 60 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}