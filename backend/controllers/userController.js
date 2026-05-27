export async function getMe(req, res) {
  res.json({
    id: req.userDoc._id,
    firebaseUid: req.userDoc.firebaseUid,
    email: req.userDoc.email,
    displayName: req.userDoc.displayName,
    leetcodeUsername: req.userDoc.leetcodeUsername || "",
    joinedDate: req.userDoc.joinedDate,
  });
}

export async function updateMe(req, res) {
  const { leetcodeUsername, displayName } = req.body;

  if (leetcodeUsername !== undefined) {
    req.userDoc.leetcodeUsername = leetcodeUsername;
  }

  if (displayName !== undefined) {
    req.userDoc.displayName = displayName;
  }

  await req.userDoc.save();

  res.json({
    id: req.userDoc._id,
    email: req.userDoc.email,
    displayName: req.userDoc.displayName,
    leetcodeUsername: req.userDoc.leetcodeUsername || "",
    joinedDate: req.userDoc.joinedDate,
  });
}
