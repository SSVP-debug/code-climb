/**
 * Registers the service worker in production only.
 *
 * Gated behind import.meta.env.PROD so local dev (Vite HMR) is never at
 * risk of serving a stale cached bundle instead of the latest module.
 * Failure to register is non-fatal — the app works fully online without
 * it, it just loses the "installable / read problems offline" feature.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[SW] Registration failed — app continues without offline support.", err);
    });
  });
}
