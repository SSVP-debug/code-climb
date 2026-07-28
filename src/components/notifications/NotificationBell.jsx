import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { ACHIEVEMENT_METADATA } from "../../config/achievementMetadata";

const POLL_INTERVAL_MS = 60 * 1000;

/** Achievement notifications resolve their real title/icon from the shared
 *  ACHIEVEMENT_METADATA (keyed by meta.achievementKey) rather than the
 *  generic title the backend stores — same single source of truth used by
 *  AchievementGallery/AchievementToast, so the wording never drifts. */
function displayFor(n) {
  if (n.type === "achievement" && n.meta?.achievementKey) {
    const meta = ACHIEVEMENT_METADATA[n.meta.achievementKey];
    if (meta) {
      return { title: `${meta.icon} ${meta.title}`, message: meta.description };
    }
  }
  return { title: n.title, message: n.message };
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await apiFetch("/api/notifications/unread-count");
      setUnreadCount(count);
    } catch {
      // Silent — a failed badge-count poll shouldn't surface an error to the user.
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: list } = await apiFetch("/api/notifications?limit=20");
      setNotifications(list);
    } catch {
      // Leave whatever was already loaded; the dropdown just won't refresh this time.
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the lightweight unread-count endpoint regardless of whether the
  // dropdown is open — this is what drives the badge. The full feed is
  // only fetched on open, since it's a heavier query.
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) fetchFeed();
  }, [open, fetchFeed]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleItemClick(n) {
    setOpen(false);
    if (!n.read) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      apiFetch(`/api/notifications/${n._id}/read`, { method: "POST" }).catch(() => {});
    }
    if (n.link) navigate(n.link);
  }

  async function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    apiFetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg hover:bg-zinc-800 transition focus:outline-none"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 15h12l-1.4-1.4A2 2 0 0 1 14 12.2V9a4 4 0 0 0-3-3.87V4a1 1 0 1 0-2 0v1.13A4 4 0 0 0 6 9v3.2a2 2 0 0 1-.6 1.4L4 15Z"
            stroke="white"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M8 17a2 2 0 0 0 4 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--theme-primary,#2dd4bf)] text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-w-[90vw] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className="font-semibold text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[var(--theme-primary,#2dd4bf)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="text-center text-zinc-500 text-sm py-8">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-zinc-500 text-sm py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => {
                const { title, message } = displayFor(n);
                return (
                  <button
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800 transition ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--theme-primary,#2dd4bf)] shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        {message && (
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{message}</p>
                        )}
                        <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;