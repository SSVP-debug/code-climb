import AchievementToast from "./AchievementToast";
import { useAppContext } from "../../hooks/useAppContext";

function AchievementToastContainer() {
  const {
    newAchievements,
    setNewAchievements,
  } = useAppContext();

  return (
    <AchievementToast
      achievements={newAchievements}
      onClose={() =>
        setNewAchievements([])
      }
    />
  );
}

export default AchievementToastContainer;