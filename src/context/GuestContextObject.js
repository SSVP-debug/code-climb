import { createContext } from "react";

// GuestContext — Guest Mode architecture. Holds the client-side-only
// "I'm exploring as a guest" state: whether a guest session is active, and
// which portal (student | recruiter | tpo) it's scoped to. See
// GuestProvider.jsx for the implementation and hooks/useGuest.js for the
// consumer hook. Never persisted server-side and never backed by a
// Firebase or Mongo identity — see that file's header comment.
export const GuestContext = createContext(null);
