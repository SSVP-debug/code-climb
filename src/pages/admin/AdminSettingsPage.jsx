import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAdminSettings } from "../../hooks/useAdminSettings";

// Same switch markup as SettingsPage.jsx/RecruiterSnapshot.jsx's toggle —
// kept visually consistent with the rest of the app rather than inventing
// a second toggle style for the admin console.
function ToggleRow({ label, description, checked, disabled, onToggle }) {
  return (
    <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="pr-4">
        <p className="text-white text-sm font-semibold">{label}</p>
        <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
          checked ? "bg-[var(--theme-primary,#2dd4bf)]" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// Shared "console panel" wrapper — JARVIS pass, spec §14: "make the layout
// feel like a configuration console" rather than headers floating loose in
// whitespace. Every real settings group (Platform availability, Registration
// access, Notifications, System flags) gets the same bordered panel
// treatment so the page reads as discrete control surfaces, not a form.
function ConsolePanel({ label, note, readOnly, children }) {
  return (
    <section
      className={`mb-6 rounded-2xl border p-5 ${
        readOnly ? "border-dashed border-zinc-800/70 bg-transparent" : "border-zinc-800 bg-zinc-900/30"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{label}</h2>
        {readOnly && (
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono-ui border border-zinc-800 rounded px-1.5 py-0.5">
            Read-only
          </span>
        )}
      </div>
      {note && <p className="text-zinc-600 text-xs mb-3">{note}</p>}
      {children}
    </section>
  );
}

// Plan 009: real Settings page, replacing the plan-001 placeholder.
export default function AdminSettingsPage() {
  const { settings, loading, saving, updateSettings } = useAdminSettings();
  const [confirmingMaintenance, setConfirmingMaintenance] = useState(false);
  const [announcementText, setAnnouncementText] = useState(null); // null = not edited yet, use settings' value

  const displayedAnnouncementText =
    announcementText ?? settings?.announcement?.text ?? "";

  // Maintenance mode is the one toggle that immediately 503s the entire
  // site for everyone but admins — worth a confirm step before turning it
  // ON specifically (not for turning it off, and not for the lower-stakes
  // registration toggles), reusing plan 003's ConfirmDialog primitive
  // rather than a bespoke prompt.
  function handleMaintenanceToggle() {
    if (!settings.maintenanceMode) {
      setConfirmingMaintenance(true);
    } else {
      updateSettings({ maintenanceMode: false });
    }
  }

  async function confirmEnableMaintenance() {
    setConfirmingMaintenance(false);
    await updateSettings({ maintenanceMode: true });
  }

  function saveAnnouncement() {
    updateSettings({
      announcement: {
        text: displayedAnnouncementText,
        active: settings.announcement?.active ?? false,
      },
    });
  }

  return (
    <>
      <PageMeta
        title="Settings — Admin Console — Code Club"
        description="Maintenance mode, registration toggles, and the global announcement."
      />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Control Configuration</h1>
          <p className="text-zinc-500 text-sm">
            Changes take effect within a few seconds, no redeploy needed.
          </p>
        </div>

        {loading && !settings ? (
          <p className="text-zinc-600 text-sm">Loading…</p>
        ) : !settings ? (
          <p className="text-zinc-600 text-sm">Couldn't load settings.</p>
        ) : (
          <>
            {settings.maintenanceMode && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm rounded-xl px-4 py-3 mb-6">
                <AlertTriangle size={16} />
                Maintenance mode is currently ON — the site is returning 503 to
                everyone but admins.
              </div>
            )}

            <ConsolePanel label="Platform availability">
              <ToggleRow
                label="Maintenance mode"
                description="Returns 503 for all non-admin, non-health-check traffic."
                checked={settings.maintenanceMode}
                disabled={saving}
                onToggle={handleMaintenanceToggle}
              />
            </ConsolePanel>

            <ConsolePanel label="Registration access">
              <div className="flex flex-col gap-3">
                <ToggleRow
                  label="Recruiter registration"
                  description="New recruiter sign-ups. Existing recruiters are unaffected either way."
                  checked={settings.recruiterRegistrationEnabled}
                  disabled={saving}
                  onToggle={() =>
                    updateSettings({
                      recruiterRegistrationEnabled:
                        !settings.recruiterRegistrationEnabled,
                    })
                  }
                />
                <ToggleRow
                  label="TPO registration"
                  description="New TPO sign-ups. Existing TPOs are unaffected either way."
                  checked={settings.tpoRegistrationEnabled}
                  disabled={saving}
                  onToggle={() =>
                    updateSettings({
                      tpoRegistrationEnabled: !settings.tpoRegistrationEnabled,
                    })
                  }
                />
              </div>
            </ConsolePanel>

            <ConsolePanel label="Notifications">
              <div className="flex flex-col gap-3">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 flex flex-col gap-2">
                  <textarea
                    value={displayedAnnouncementText}
                    onChange={(e) =>
                      setAnnouncementText(e.target.value.slice(0, 500))
                    }
                    placeholder="Shown as a banner to every visitor, logged in or not."
                    rows={3}
                    maxLength={500}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 text-xs">
                      {displayedAnnouncementText.length}/500
                    </span>
                    <Button
                      size="sm"
                      onClick={saveAnnouncement}
                      disabled={saving}
                    >
                      Save text
                    </Button>
                  </div>
                </div>
                <ToggleRow
                  label="Show announcement banner"
                  description="Only shown to visitors when this is on, regardless of whether text is set."
                  checked={settings.announcement?.active ?? false}
                  disabled={saving}
                  onToggle={() =>
                    updateSettings({
                      announcement: {
                        text: settings.announcement?.text ?? "",
                        active: !settings.announcement?.active,
                      },
                    })
                  }
                />
              </div>
            </ConsolePanel>

            <ConsolePanel
              label="System flags"
              readOnly
              note={
                settings.envFlags?.note ||
                "Set via environment variable — changing requires a redeploy, not this page."
              }
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/60 rounded-xl px-4 py-3">
                  <span className="text-zinc-300 text-sm">Monetization</span>
                  <span
                    className={`text-xs font-semibold ${settings.envFlags?.monetizationEnabled ? "text-green-400" : "text-zinc-500"}`}
                  >
                    {settings.envFlags?.monetizationEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/60 rounded-xl px-4 py-3">
                  <span className="text-zinc-300 text-sm">
                    B2B (college dashboard)
                  </span>
                  <span
                    className={`text-xs font-semibold ${settings.envFlags?.b2bEnabled ? "text-green-400" : "text-zinc-500"}`}
                  >
                    {settings.envFlags?.b2bEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </ConsolePanel>
          </>
        )}
      </div>

      {confirmingMaintenance && (
        <ConfirmDialog
          title="Turn on maintenance mode?"
          description="Every non-admin request will get a 503 immediately — students, recruiters, and TPOs included. You can turn it back off from this same page."
          confirmLabel="Turn on"
          destructive
          loading={saving}
          onConfirm={confirmEnableMaintenance}
          onCancel={() => setConfirmingMaintenance(false)}
        />
      )}
    </>
  );
}