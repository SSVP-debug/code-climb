import { Users2, ExternalLink } from "lucide-react";
import Button from "../ui/Button";
import SideDrawer, { DrawerSection, DrawerField } from "./command/SideDrawer";

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  verified: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

/**
 * CollegeDetailDrawer — Command Center Phase 5 "College Intelligence."
 * Deliberately a light touch: same fields the card grid already renders
 * (collegeController.js's getColleges response), just given room to show
 * the two caveat notes in full instead of truncated inline italics, plus
 * "View students" promoted to the drawer's primary action.
 */
export default function CollegeDetailDrawer({ college, open, onClose, onViewStudents }) {
  if (!college) return <SideDrawer open={open} onClose={onClose} title="" />;

  return (
    <SideDrawer open={open} onClose={onClose} eyebrow="College" title={college.name}>
      <DrawerSection label="Status">
        <span
          className={`text-xs px-2 py-1 rounded-full uppercase tracking-wide font-semibold ${
            STATUS_STYLES[college.status] || "bg-zinc-500/10 text-zinc-400"
          }`}
        >
          {college.status}
        </span>
      </DrawerSection>

      <DrawerSection label="Reach">
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <p className="text-white text-2xl font-black">{college.studentCount}</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Students</p>
          </div>
          <div>
            <p className="text-white text-2xl font-black">{college.activeStudentCount}</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Active</p>
          </div>
          <div>
            <p className="text-white text-2xl font-black">{college.tpoCount}</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide">TPOs</p>
          </div>
        </div>
        <DrawerField label="Domains" value={college.domains?.join(", ")} />
      </DrawerSection>

      <DrawerSection label="Activity">
        <DrawerField label="Problems solved" value={college.totalSolvedProblems} />
      </DrawerSection>

      <DrawerSection label="Notes">
        <p className="text-zinc-500 text-xs leading-relaxed mb-2">{college.studentCountCaveat}</p>
        <p className="text-zinc-500 text-xs leading-relaxed">{college.recruiterCountNote}</p>
      </DrawerSection>

      <DrawerSection label="Actions">
        <Button
          size="sm"
          variant="secondary"
          className="w-full justify-center"
          onClick={() => onViewStudents(college)}
        >
          <Users2 size={14} />
          View students
          <ExternalLink size={11} />
        </Button>
      </DrawerSection>
    </SideDrawer>
  );
}
