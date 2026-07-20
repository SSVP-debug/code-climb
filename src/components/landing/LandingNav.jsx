import { Link } from "react-router-dom";
import Button from "../ui/Button";

function LandingNav({ user }) {
  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-ink-700">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight">Code Club</span>
        <span className="text-[10px] bg-verdict-accept/10 text-verdict-accept border border-verdict-accept/25 px-2 py-0.5 rounded-full font-mono-ui font-semibold tracking-widest uppercase">
          Beta
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to={user ? "/problems" : "/login?role=student"}
          className="text-sm text-zinc-400 hover:text-white transition px-4 py-2"
        >
          Problems
        </Link>
        <Button to={user ? "/dashboard" : "/portal"} variant="theme" size="sm">
          {user ? "Dashboard →" : "Get Started"}
        </Button>
      </div>
    </nav>
  );
}

export default LandingNav;