import { Link } from "react-router-dom";
import Button from "../ui/Button";
import BWModeToggle from "../common/BWModeToggle";

function LandingNav({ user }) {
  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-ink-700">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight">Code Club</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to={user ? "/problems" : "/login?role=student"}
          className="text-sm text-zinc-400 hover:text-white transition px-4 py-2"
        >
          Problems
        </Link>
        <BWModeToggle />
        <Button to={user ? "/dashboard" : "/portal"} variant="theme" size="sm">
          {user ? "Dashboard →" : "Get Started"}
        </Button>
      </div>
    </nav>
  );
}

export default LandingNav;