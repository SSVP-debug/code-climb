import { useTheme } from "../../../context/ThemeContext";
import { auth } from "../../../firebase/firebase";
import SectionCard from "../../ui/layout/SectionCard";

function WelcomeBanner() {
  const { theme } = useTheme();

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const name =
    auth.currentUser?.displayName?.split(" ")[0] || "Coder";

  return (
    <SectionCard>

      <p className="text-zinc-400 text-sm">
        {greeting},
      </p>

      <h1 className="text-4xl font-bold mt-2">
        {name} 👋
      </h1>

      <p className="text-zinc-400 mt-3">
        Ready for today's experiment?
      </p>

    </SectionCard>
  );
}

export default WelcomeBanner;