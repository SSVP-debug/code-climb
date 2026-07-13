import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import SectionCard from "../ui/layout/SectionCard";
import Button from "../ui/Button";
import { useAppContext } from "../../hooks/useAppContext";

// Mirrors backend/controllers/userController.js PREFERRED_ROLES — keep in
// sync if that list changes.
const PREFERRED_ROLES = [
  "Backend",
  "Frontend",
  "Full Stack",
  "Mobile",
  "Data / ML",
  "DevOps",
  "QA",
  "Other",
];

const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 14 }, (_, i) => String(CURRENT_YEAR - 5 + i));

/**
 * RecruiterSnapshot
 *
 * Editable on /profile (this component), read-only on the public profile
 * and in the recruiter portal's search results. This is the field that
 * actually closes the loop between "student has a great profile" and
 * "recruiter can find and act on it" — see Phase 9C plan.
 */
function RecruiterSnapshot() {
  const { recruiterSnapshot, updateRecruiterSnapshot } = useAppContext();

  const [availableForWork, setAvailableForWork] = useState(false);
  const [preferredRole, setPreferredRole] = useState("");
  const [expectedGraduation, setExpectedGraduation] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setAvailableForWork(recruiterSnapshot.availableForWork);
    setPreferredRole(recruiterSnapshot.preferredRole || "");
    setExpectedGraduation(recruiterSnapshot.expectedGraduation || "");
  }, [recruiterSnapshot]);

  function markDirty(setter) {
    return (value) => {
      setter(value);
      setDirty(true);
    };
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateRecruiterSnapshot({
        availableForWork,
        preferredRole: preferredRole || null,
        expectedGraduation: expectedGraduation || null,
      });
      toast.success("Recruiter Snapshot updated");
      setDirty(false);
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="Recruiter Snapshot"
      icon="🎯"
      subtitle="Shown to recruiters and TPOs viewing your public profile."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-4">
          <div>
            <p className="font-medium text-sm">Available for opportunities</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              Shows a green "Open to work" badge on your public profile.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={availableForWork}
            onClick={() => markDirty(setAvailableForWork)(!availableForWork)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              availableForWork ? "bg-green-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                availableForWork ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-xs">Preferred Role</label>
            <select
              value={preferredRole}
              onChange={(e) => markDirty(setPreferredRole)(e.target.value)}
              className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Not set</option>
              {PREFERRED_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-400 text-xs">Expected Graduation</label>
            <select
              value={expectedGraduation}
              onChange={(e) => markDirty(setExpectedGraduation)(e.target.value)}
              className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Not set</option>
              {GRADUATION_YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save Snapshot"}
        </Button>
      </div>
    </SectionCard>
  );
}

export default RecruiterSnapshot;