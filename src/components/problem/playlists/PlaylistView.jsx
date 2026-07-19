import SectionCard from "../../ui/layout/SectionCard";
import { ListChecks } from "lucide-react";

function PlaylistView() {
  return (
    <SectionCard
      title="Playlists"
      subtitle="Curated learning collections."
      icon={<ListChecks size={18} strokeWidth={2} />}
      accented
    >
      <p className="text-zinc-500 text-sm">Coming soon.</p>
    </SectionCard>
  );
}

export default PlaylistView;