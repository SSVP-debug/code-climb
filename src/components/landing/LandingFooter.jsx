import { Link } from "react-router-dom";
import { SUPPORT_EMAIL } from "../../config/site.js";
import ContactChannels from "../common/ContactChannels";

function LandingFooter({ user }) {
  return (
    <footer className="border-t border-ink-700 px-6 md:px-12 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm font-bold text-zinc-500">Code Club</span>
        <p className="text-xs text-zinc-700">
          Built for engineering students. Not affiliated with Code Club UK.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex gap-5 text-xs text-zinc-600 font-mono-ui">
            <Link to="/problems" className="hover:text-zinc-400 transition">Problems</Link>
            <Link to={user ? "/dashboard" : "/portal"} className="hover:text-zinc-400 transition">Dashboard</Link>
            <Link to={user ? "/dashboard" : "/portal"} className="hover:text-zinc-400 transition">For TPOs</Link>
            <Link to={user ? "/dashboard" : "/portal"} className="hover:text-zinc-400 transition">For Recruiters</Link>
            <Link to="/privacy" className="hover:text-zinc-400 transition">Privacy</Link>
            <Link to="/terms" className="hover:text-zinc-400 transition">Terms</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-zinc-400 transition">Contact</a>
          </div>
          {/* Official community channels (WhatsApp/Discord/email) — env
              driven via ContactChannels/config/site.js, separate from the
              SUPPORT_EMAIL legal contact above. */}
          <ContactChannels variant="inline" />
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;