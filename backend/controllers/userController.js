export async function getMe(req, res) {
  res.json({
    id: req.userDoc._id,
    firebaseUid: req.userDoc.firebaseUid,
    email: req.userDoc.email,
    displayName: req.userDoc.displayName,
    username: req.userDoc.username || "",
    isProfilePublic: req.userDoc.isProfilePublic,


    leetcodeUsername: req.userDoc.leetcodeUsername || "",
    joinedDate: req.userDoc.joinedDate,
  });
}

export async function updateMe(req, res) {
  const {
    leetcodeUsername,
    displayName,
    username,
  } = req.body;

  if (leetcodeUsername !== undefined) {
    req.userDoc.leetcodeUsername = leetcodeUsername;
  }

  if (displayName !== undefined) {
    req.userDoc.displayName = displayName;
  }

  if (username !== undefined) {
    const normalized =
      username
        .trim()
        .toLowerCase();

    const valid =
      /^[a-z0-9_-]{3,20}$/.test(
        normalized
      );

    if (!valid) {
      return res.status(400).json({
        error:
          "Username must be 3-20 chars and contain only letters, numbers, _ or -",
      });
    }

    const existing =
      await req.userDoc.constructor.findOne(
        {
          username: normalized,
          _id: {
            $ne:
              req.userDoc._id,
          },
        }
      );

    if (existing) {
      return res.status(409).json({
        error:
          "Username already taken",
      });
    }

    req.userDoc.username =
      normalized;
  }
  console.log(
    "Saving username:",
    req.userDoc.username
  );

  await req.userDoc.save();

  res.json({
    id: req.userDoc._id,
    email: req.userDoc.email,
    displayName: req.userDoc.displayName,
    username:
      req.userDoc.username || "",

    isProfilePublic:
      req.userDoc.isProfilePublic,
    leetcodeUsername: req.userDoc.leetcodeUsername || "",
    joinedDate: req.userDoc.joinedDate,
  });
}
