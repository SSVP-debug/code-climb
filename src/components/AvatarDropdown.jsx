import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function AvatarDropdown({ user, onLogout, mobile = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="focus:outline-none"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? "User"}
            className={mobile
              ? "w-8 h-8 rounded-full border border-zinc-700"
              : "w-9 h-9 rounded-full border border-zinc-700"}
          />
        ) : (
          <div
            className={mobile
              ? "w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm"
              : "w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm"}
          >
            {user?.displayName?.charAt(0)}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-zinc-800">
            <p className="font-semibold">{user?.displayName}</p>
            <p className="text-xs text-zinc-400">{user?.email}</p>
          </div>

          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-zinc-800"
            >
              View Profile
            </Link>

            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-zinc-800"
            >
              Settings
            </Link>

            <Link
              to="/pricing"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-zinc-800"
            >
              Pricing
            </Link>
          </div>

          <div className="border-t border-zinc-800 p-2">
            <button
              onClick={onLogout}
              className="w-full rounded-lg bg-white text-black py-2 font-semibold hover:bg-zinc-200"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarDropdown;