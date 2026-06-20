export async function completeDailyChallenge(
  req,
  res
) {
  try {
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({
        error: "Missing slug",
      });
    }

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const alreadyCompleted =
      (req.userDoc.dailyChallengeHistory || []).some(
        (entry) =>
          entry.date === today &&
          entry.slug === slug
      );

    if (alreadyCompleted) {
      return res.json({
        success: true,
        alreadyCompleted: true,
      });
    }

    req.userDoc.dailyChallengeHistory.push({
      date: today,
      slug,
      completed: true,
      completedAt: new Date(),
    });

    await req.userDoc.save();

    res.json({
      success: true,
      alreadyCompleted: false,
    });
  } catch (err) {
    console.error(
      "[Daily Challenge] Failed:",
      err
    );

    res.status(500).json({
      error: "Failed to save daily challenge",
    });
  }
}