import SectionCard from "../../ui/layout/SectionCard";
import { Bookmark } from "lucide-react";

function SavedView() {
  return (
    <SectionCard
      title="Saved Problems"
      subtitle="Quickly revisit bookmarked problems."
      icon={<Bookmark size={18} strokeWidth={2} />}
      accented
    >
      <p className="text-zinc-500 text-sm">Coming soon.</p>
    </SectionCard>
  );
}

export default SavedView;