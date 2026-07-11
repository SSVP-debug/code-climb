import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../services/api";

/**
 * EditorialPanel
 *
 * Renders the official editorial for a problem, via the dedicated gated
 * endpoint (GET /api/problems/:slug/editorial — solve-to-unlock, with a
 * premium/admin bypass; see backend/routes/editorial.js).
 *
 * Deliberately does NOT read editorial content from the general problem
 * object passed down from the parent page — that general fetch
 * (getProblemBySlug) now explicitly excludes editorial.content precisely
 * so this gate can't be bypassed by reading the already-loaded problem
 * data. This component's own fetch is the only path to the real content.
 *
 * Content is stored as plain markdown text but rendered as plain text
 * here (whitespace-pre-wrap, matching the Description/AIHintPanel
 * convention elsewhere on this page) — there's no markdown renderer in
 * this project yet. If editorial content ends up written with heavy
 * markdown formatting, swap this for a proper renderer.
 */
function EditorialPanel({ slug }) {
  const [state, setState] = useState({
    loading: true,
    available: false,
    locked: false,
    content: "",
    author: "",
    updatedAt: null,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const data = await apiFetch(`/api/problems/${slug}/editorial`);
        if (cancelled) return;
        setState({
          loading: false,
          available: !!data.available,
          locked: false,
          content: data.content || "",
          author: data.author || "Code Club",
          updatedAt: data.updatedAt || null,
          error: "",
        });
      } catch (err) {
        if (cancelled) return;
        // apiFetch throws with the backend's `error` message. The locked
        // (403, "Solve this problem first...") case is the expected,
        // common path here — not a real error — so it's handled
        // separately from a genuine fetch failure.
        const locked = err.message?.toLowerCase().includes("solve this problem");
        setState({
          loading: false,
          available: false,
          locked,
          content: "",
          author: "",
          updatedAt: null,
          error: locked ? "" : err.message || "Could not load the editorial.",
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.loading) {
    return (
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Editorial</h3>
        <div className="flex items-center gap-2 text-sm text-zinc-500 px-1 py-2">
          <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
          Loading editorial…
        </div>
      </section>
    );
  }

  if (state.locked) {
    return (
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Editorial</h3>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5">🔒</span>
          <div>
            <p className="text-sm text-amber-400">
              Solve this problem to unlock the editorial.
            </p>
            <Link
              to="/pricing"
              className="inline-block mt-2 text-xs font-semibold text-green-400 hover:text-green-300"
            >
              Or unlock all editorials with Pro →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (state.error) {
    return (
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Editorial</h3>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-400">{state.error}</p>
        </div>
      </section>
    );
  }

  if (!state.available) {
    return (
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Editorial</h3>
        <p className="text-sm text-zinc-500">
          No editorial has been written for this problem yet.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Editorial</h3>
        <span className="text-xs text-zinc-500">
          {state.author}
          {state.updatedAt && ` · ${new Date(state.updatedAt).toLocaleDateString()}`}
        </span>
      </div>
      <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-[15px] rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        {state.content}
      </div>
    </section>
  );
}

export default EditorialPanel;