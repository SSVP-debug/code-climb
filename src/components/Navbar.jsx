import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";
import { useContext } from "react";
import { AuthContext } from "../context/authContext";

function Navbar() {

    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    console.log(user);
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
                <Link to="/problems" className="hover:text-zinc-300 transition">
                    Problems
                </Link>
                <Link to="/analytics" className="hover:text-zinc-300 transition">
                    Analytics
                </Link>

                <Link to="/profile" className="hover:text-zinc-300 transition">
                    Profile
                </Link>

                <div className="flex items-center gap-3">

                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full border border-zinc-700"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
                            {user?.displayName?.charAt(0)}
                        </div>
                    )}

                    <div className="hidden md:block">
                        <p className="font-semibold text-sm">
                            {user?.displayName}
                        </p>

                        <p className="text-zinc-400 text-xs">
                            {user?.email}
                        </p>
                    </div>

                </div>

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