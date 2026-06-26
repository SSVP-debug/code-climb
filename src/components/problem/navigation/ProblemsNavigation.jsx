import {
  BookOpen,
  Shapes,
  ListChecks,
  Bookmark,
} from "lucide-react";

const navigationItems = [
  {
    id: "browse",
    label: "Browse",
    description: "Explore all vaults",
    icon: BookOpen,
  },
  {
    id: "patterns",
    label: "Learn by Pattern",
    description: "Master one concept",
    icon: Shapes,
  },
  {
    id: "playlists",
    label: "Playlists",
    description: "Curated collections",
    icon: ListChecks,
  },
  {
    id: "saved",
    label: "Saved",
    description: "Your bookmarked vaults",
    icon: Bookmark,
  },
];

// Future items — uncomment when ready:
// { id: "roadmaps", label: "Roadmaps", description: "Structured learning paths", icon: Map }
// { id: "company",  label: "Company Tracks", description: "Interview prep by company", icon: Building2 }

function ProblemsNavigation({ activeView, setActiveView }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full text-left rounded-xl px-3 py-2.5 transition-all group ${
              active
                ? "bg-green-500 text-black shadow-lg shadow-green-500/20"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 p-1 rounded-lg ${
                active ? "bg-black/15" : "bg-zinc-800 group-hover:bg-zinc-700"
              }`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm leading-tight ${
                  active ? "text-black" : "text-zinc-200"
                }`}>
                  {item.label}
                </p>
                <p className={`text-xs leading-tight mt-0.5 ${
                  active ? "text-black/60" : "text-zinc-500"
                }`}>
                  {item.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

export default ProblemsNavigation;
