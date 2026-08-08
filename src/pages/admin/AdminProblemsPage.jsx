import { useState } from "react";
import { Plus, Trash2, Pencil, Eye, X } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProblemForm from "../../components/admin/ProblemForm";
import ProblemPreview from "../../components/admin/ProblemPreview";
import { useAdminProblems, PROBLEMS_PAGE_SIZE } from "../../hooks/useAdminProblems";

const DIFFICULTY_BADGE = {
  Easy: "bg-emerald-500/10 text-emerald-400",
  Medium: "bg-amber-500/10 text-amber-400",
  Hard: "bg-rose-500/10 text-rose-400",
};

const SOURCE_BADGE = {
  admin: "bg-teal-500/10 text-teal-300",
  catalog: "bg-zinc-800 text-zinc-400",
};

// Verbatim from backend/package.json — plan 006 scope decision: running
// these scripts from a live HTTP endpoint is its own security surface
// (arbitrary backend script execution from a request), so Import/Export
// is documented as CLI reference text here, not wired as clickable actions.
const CLI_COMMANDS = [
  { label: "Export catalog problems to folders", command: "npm run problems:export-to-folders" },
  { label: "Import problems from folders", command: "npm run problems:import-from-folders" },
];

function Panel({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Plan 006: replaces the plan-001 placeholder. Full CRUD for admin-created
// problems; catalog problems (from src/data/problems.js) are edit-limited
// to topic/pattern/sourceType and delete-blocked — enforced server-side
// (adminProblemController.js), this UI just reflects those limits so an
// admin doesn't waste time on an edit that'll be rejected or reverted.
export default function AdminProblemsPage() {
  const {
    problems,
    problemsTotal,
    problemsLoading,
    problemsPage,
    setProblemsPage,
    difficultyFilter,
    setDifficultyFilter,
    sourceFilter,
    setSourceFilter,
    searchInput,
    setSearchInput,
    saving,
    fetchProblemForEdit,
    createProblem,
    updateProblem,
    deleteProblem,
  } = useAdminProblems();

  // "closed" | "create" | "edit"
  const [panelMode, setPanelMode] = useState("closed");
  const [editingProblem, setEditingProblem] = useState(null); // full detail, edit mode only
  const [activeTab, setActiveTab] = useState("edit"); // "edit" | "preview"
  const [serverIssues, setServerIssues] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // slug pending delete confirmation
  const [rowLoading, setRowLoading] = useState(null); // slug currently fetching for edit

  const totalPages = Math.max(1, Math.ceil(problemsTotal / PROBLEMS_PAGE_SIZE));

  function openCreate() {
    setEditingProblem(null);
    setServerIssues(null);
    setActiveTab("edit");
    setPanelMode("create");
  }

  async function openEdit(slug) {
    setRowLoading(slug);
    try {
      const data = await fetchProblemForEdit(slug);
      setEditingProblem(data.problem);
      setServerIssues(null);
      setActiveTab("edit");
      setPanelMode("edit");
    } finally {
      setRowLoading(null);
    }
  }

  function closePanel() {
    setPanelMode("closed");
    setEditingProblem(null);
    setServerIssues(null);
  }

  async function handleSubmit(payload) {
    try {
      setServerIssues(null);
      if (panelMode === "create") {
        await createProblem(payload);
      } else {
        await updateProblem(editingProblem.slug, payload);
      }
      closePanel();
    } catch (err) {
      // apiFetch attaches .body (the parsed error JSON) — see src/services/api.js.
      if (err.body?.issues) setServerIssues(err.body.issues);
    }
  }

  async function confirmDelete() {
    const slug = deleteTarget;
    setDeleteTarget(null);
    await deleteProblem(slug);
  }

  return (
    <>
      <PageMeta title="Problems — Admin Console — Code Club" description="Manage the problem catalog." />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white">Problems</h1>
            <p className="text-zinc-500 text-sm">
              {problemsTotal > 0 ? `${problemsTotal} problem${problemsTotal === 1 ? "" : "s"}` : "No problems yet."}
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" /> Create problem
          </Button>
        </div>

        {/* Persistent notice — plan 006's explicit requirement, so an admin
            doesn't discover the seed-overwrite tension the hard way. */}
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          Catalog problems are managed in <code className="bg-black/20 px-1 rounded">src/data/problems.js</code>.
          Edits made here to catalog problems are limited to Topic/Pattern/Source Type, and even those are
          temporary — they'll be overwritten by the next <code className="bg-black/20 px-1 rounded">npm run seed</code>.
        </div>

        <div className="mb-4 px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Import / Export</span> happens via the existing CLI scripts,
          not from this page:
          <ul className="mt-1.5 space-y-1">
            {CLI_COMMANDS.map((c) => (
              <li key={c.command}>
                <code className="bg-black/30 px-1.5 py-0.5 rounded text-zinc-300">{c.command}</code> — {c.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by title or slug…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
          >
            <option value="">All difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
          >
            <option value="">All sources</option>
            <option value="admin">Admin-created</option>
            <option value="catalog">Catalog</option>
          </select>
        </div>

        {problemsLoading ? (
          <p className="text-zinc-600 text-sm">Loading…</p>
        ) : problems.length === 0 ? (
          <p className="text-zinc-600 text-sm">No matching problems.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900/60 text-left text-zinc-500 text-xs uppercase tracking-widest">
                  <th className="px-4 py-2 font-semibold">Title</th>
                  <th className="px-4 py-2 font-semibold">Difficulty</th>
                  <th className="px-4 py-2 font-semibold">Topic</th>
                  <th className="px-4 py-2 font-semibold">Source</th>
                  <th className="px-4 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.slug} className="border-t border-zinc-800">
                    <td className="px-4 py-2 text-white font-medium">{p.title}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${DIFFICULTY_BADGE[p.difficulty] || ""}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-400 text-xs">{p.topic}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${SOURCE_BADGE[p.adminSource] || ""}`}>
                        {p.adminSource}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p.slug)}
                          disabled={rowLoading === p.slug}
                          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40"
                          aria-label={`Edit ${p.title}`}
                        >
                          <Pencil size={14} />
                        </button>
                        {p.adminSource === "admin" && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p.slug)}
                            className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                            aria-label={`Delete ${p.title}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {problemsTotal > PROBLEMS_PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
            <button
              disabled={problemsPage <= 1}
              onClick={() => setProblemsPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded hover:bg-zinc-900 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span>
              Page {problemsPage} of {totalPages}
            </span>
            <button
              disabled={problemsPage >= totalPages}
              onClick={() => setProblemsPage((p) => p + 1)}
              className="px-2 py-1 rounded hover:bg-zinc-900 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {panelMode !== "closed" && (
        <Panel title={panelMode === "create" ? "Create problem" : `Edit: ${editingProblem?.title}`} onClose={closePanel}>
          {panelMode === "edit" && (
            <div className="flex items-center gap-1 mb-4 bg-zinc-900 rounded-lg p-1 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                  activeTab === "edit" ? "bg-zinc-800 text-white" : "text-zinc-500"
                }`}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                  activeTab === "preview" ? "bg-zinc-800 text-white" : "text-zinc-500"
                }`}
              >
                <Eye size={12} /> Preview
              </button>
            </div>
          )}

          {activeTab === "preview" ? (
            <ProblemPreview problem={editingProblem} />
          ) : (
            <ProblemForm
              mode={panelMode}
              initialProblem={editingProblem}
              onSubmit={handleSubmit}
              onCancel={closePanel}
              saving={saving}
              serverIssues={serverIssues}
            />
          )}
        </Panel>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this problem?"
          description="This permanently deletes the problem. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}