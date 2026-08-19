import { useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/api";
import Button from "../ui/Button";

// Extracted from RecruiterDashboardPage.jsx so PublicProfile.jsx (a
// separately lazy-loaded route chunk, see src/App.jsx's lazy() calls) can
// reuse the same "Send Skills Test" / "Express Interest" actions without
// importing the entire recruiter dashboard page and its FilterBar/candidate
// table code into PublicProfile's bundle. RecruiterDashboardPage imports
// both from here now instead of defining them locally.

export function SendTestModal({ candidate, onClose, onSent }) {
  const [slugs, setSlugs] = useState("");
  const [duration, setDuration] = useState(90);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const problemSlugs = slugs.split(",").map(s => s.trim()).filter(Boolean);
    try {
      await apiFetch("/api/recruiter/skills-test", {
        method: "POST",
        body: JSON.stringify({ candidateUsername: candidate.username, problemSlugs, durationMinutes: duration, note }),
      });
      onSent();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to send test. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Send Skills Test</h3>
        <p className="text-zinc-500 text-sm mb-4">To: {candidate.displayName} ({candidate.username})</p>
        <div className="space-y-3">
          <textarea value={slugs} onChange={e => setSlugs(e.target.value)} rows={2}
            placeholder="Problem slugs, comma-separated (e.g. two-sum, valid-parentheses)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
          <div className="flex gap-3">
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="Duration (minutes)" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note to candidate"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={send} disabled={loading || !slugs} loading={loading} className="flex-1">
            {loading ? "Sending…" : "Send Test"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ExpressInterestModal({ candidate, onClose, onSent }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      await apiFetch("/api/recruiter/interest", {
        method: "POST",
        body: JSON.stringify({ candidateUsername: candidate.username, note }),
      });
      onSent();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to send. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Express Interest</h3>
        <p className="text-zinc-500 text-sm mb-4">To: {candidate.displayName} ({candidate.username})</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500}
          placeholder="A short note — what caught your eye, what role you have in mind…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={send} disabled={loading || !note.trim()} loading={loading}>
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}