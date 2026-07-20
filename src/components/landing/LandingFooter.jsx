import { Link } from "react-router-dom";
import { SUPPORT_EMAIL } from "../../config/site.js";

function LandingFooter({ user }) {
  return (
    <footer className="border-t border-ink-700 px-6 md:px-12 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm font-bold text-zinc-500">Code Club</span>
        <p className="text-xs text-zinc-700">
          Built for engineering students. Not affiliated with Code Club UK.
        </p>
        <div className="flex gap-5 text-xs text-zinc-600 font-mono-ui">
          <Link to="/problems" className="hover:text-zinc-400 transition">Problems</Link>
          <Link to={user ? "/dashboard" : "/portal"} className="hover:text-zinc-400 transition">Dashboard</Link>
          <Link to="/login?role=tpo" className="hover:text-zinc-400 transition">For TPOs</Link>
          <Link to="/login?role=recruiter" className="hover:text-zinc-400 transition">For Recruiters</Link>
          <Link to="/privacy" className="hover:text-zinc-400 transition">Privacy</Link>
          <Link to="/terms" className="hover:text-zinc-400 transition">Terms</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-zinc-400 transition">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;