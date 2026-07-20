function DemoDatasetSection() {
  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
        Demo dataset
      </h2>
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-4 text-sm">
        <p className="text-zinc-400">
          8 demo students, 1 demo college, 1 demo company — safe to
          screen-record, none of it is real user data.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-zinc-800">
            <p className="text-zinc-600">College domain</p>
            <p className="text-violet-300">demo-institute.codeclub.dev</p>
          </div>
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-zinc-800">
            <p className="text-zinc-600">Company domain</p>
            <p className="text-sky-300">demo-corp.codeclub.dev</p>
          </div>
        </div>
        <p className="text-zinc-600 text-xs mt-3">
          View as → TPO shows this college automatically once your admin
          account has been wired to it (one-time, via the seed script).
          For Recruiter search, type the college domain above into the
          College filter to pull up the demo students.
        </p>
        <p className="text-zinc-700 text-xs mt-2">
          Regenerate or refresh anytime:{" "}
          <code className="text-zinc-500">node scripts/seedDemoAccounts.js</code>
        </p>
      </div>
    </section>
  );
}

export default DemoDatasetSection;
