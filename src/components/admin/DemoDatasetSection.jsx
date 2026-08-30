function DemoDatasetSection() {
  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold mb-3">
        Demo dataset
      </h2>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-4 text-sm">
        <p className="text-[var(--muted-foreground)]">
          8 demo students, 1 demo college, 1 demo company — safe to
          screen-record, none of it is real user data.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-[var(--surface-elevated)]/60 rounded-lg px-3 py-2 border border-[var(--border)]">
            <p className="text-[var(--muted-foreground)]">College domain</p>
            <p className="text-violet-300">demo-institute.codeclub.dev</p>
          </div>
          <div className="bg-[var(--surface-elevated)]/60 rounded-lg px-3 py-2 border border-[var(--border)]">
            <p className="text-[var(--muted-foreground)]">Company domain</p>
            <p className="text-sky-300">demo-corp.codeclub.dev</p>
          </div>
        </div>
        <p className="text-[var(--muted-foreground)] text-xs mt-3">
          View as → TPO shows this college automatically once your admin
          account has been wired to it (one-time, via the seed script).
          For Recruiter search, type the college domain above into the
          College filter to pull up the demo students.
        </p>
        <p className="text-[var(--muted-foreground)] text-xs mt-2">
          Regenerate or refresh anytime:{" "}
          <code className="text-[var(--muted-foreground)]">node scripts/seedDemoAccounts.js</code>
        </p>
      </div>
    </section>
  );
}

export default DemoDatasetSection;