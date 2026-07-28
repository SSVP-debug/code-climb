import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold text-zinc-600">404</h1>
      <p className="text-zinc-400 mt-4 text-lg">Page not found.</p>
      <Link
        to="/dashboard"
        className="mt-8 px-6 py-3 bg-[var(--theme-primary,#2dd4bf)] text-black rounded-xl font-semibold hover:brightness-110 transition"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;