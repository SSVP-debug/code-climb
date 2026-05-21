import Navbar from "../components/Navbar";

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="p-8">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;