import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <nav className="bg-zinc-900 text-white px-8 py-4 flex items-center justify-between border-b border-zinc-800">
      
      <div className="text-2xl font-bold">
        Code Climb
      </div>

      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="hover:text-zinc-300 transition">
          Dashboard
        </Link>

        <Link to="/analytics" className="hover:text-zinc-300 transition">
          Analytics
        </Link>

        <Link to="/profile" className="hover:text-zinc-300 transition">
          Profile
        </Link>

        <button
            onClick={handleLogout}
            className="bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-zinc-200 transition"
        >
            Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;