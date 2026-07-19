import Navbar from "../components/Navbar";
import ThemeSkin from "../themes/ThemeSkin";

function DashboardLayout({ children }) {
  return (
    <ThemeSkin>
      <div className="min-h-screen bg-black text-white">

        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </ThemeSkin>
  );
}

export default DashboardLayout;