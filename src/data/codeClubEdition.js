/**
 * codeClubEdition.js
 *
 * Campaign map for Code Club Edition — the story wrapper around the
 * missions in src/data/code-club-edition/. This file owns ONLY campaign
 * metadata: chapter identity (title, story, theme, color, icon), chapter
 * ordering, and per-mission narrative framing (missionTitle, storyIntro).
 * It never duplicates problem content (description, testcases, starter
 * code) — each mission here is referenced by `slug` and resolved against
 * the live Problem catalog at render time, exactly the same seam
 * useLearningPaths() uses for Learning Paths (see that file's header
 * comment for the full rationale — this mirrors it deliberately).
 *
 * Keeping campaign metadata separate from problem metadata means:
 *   - A chapter's story can be rewritten without touching a Problem doc.
 *   - A mission's problem content can be fixed/improved without touching
 *     the campaign map.
 *   - Chapters are data, not code — add an object to `chapters` below (or
 *     a mission to an existing chapter's `missions` array) and no other
 *     file needs to change. ChapterCard, ChapterDetail, MissionCard, etc.
 *     are all generic renderers over this shape; nothing is hardcoded
 *     per-chapter in the UI layer.
 *
 * Unlock model:
 *   - Missions unlock sequentially within a chapter (solve mission N to
 *     unlock N+1) — same rule as Learning Paths, see
 *     src/utils/codeClubEditionProgress.js.
 *   - A chapter unlocks once the previous chapter is fully complete.
 *     Chapter 1 is always unlocked. `unlockRequirement: null` means
 *     "always unlocked"; `{ chapterId }` means "complete that chapter
 *     first".
 *   - `comingSoon: true` chapters have no missions yet — they're shown as
 *     a locked preview card so the campaign map communicates what's next
 *     without shipping broken/empty content. `plannedMissionCount` drives
 *     their card copy ("5 missions — coming soon").
 *
 * Content-management note (see PRD "Content Management" section): this
 * static file is the intentional v1 architecture, not a placeholder. A
 * future community-submission pipeline (AI review → admin review →
 * publish) would write into a real Chapter/Mission backend model instead
 * of this file — at that point only this module and its single seam
 * (useCodeClubEdition) change; no consuming component would need to.
 */

const codeClubEdition = [
  {
    id: "the-missing-cipher",
    chapterNumber: 1,
    title: "The Missing Cipher",
    tagline: "A detective's notebook, torn pages, and one hidden pattern.",
    storyDescription:
      "A veteran detective's case notebook was found torn apart at the scene. Piece together the fragments — ledgers, badge scans, a locked vault — to find the one clue the culprit missed.",
    theme: "mystery",
    color: "violet",
    icon: "Search",
    difficulty: "Beginner",
    estimatedTime: { low: 1, high: 2, unit: "hours" },
    unlockRequirement: null,
    comingSoon: false,
    missions: [
      {
        slug: "the-torn-ledger",
        missionNumber: 1,
        missionTitle: "The Torn Ledger",
        storyIntro:
          "The detective recovered a damaged notebook. Only one pair of numbers hidden inside reveals the suspect.",
      },
      {
        slug: "the-duplicate-suspect",
        missionNumber: 2,
        missionTitle: "The Duplicate Suspect",
        storyIntro:
          "The scene's badge scanner logged everyone who came and went — except someone came twice.",
      },
      {
        slug: "the-guards-password",
        missionNumber: 3,
        missionTitle: "The Guard's Password",
        storyIntro:
          "The vault's old lock still works, but only for a password with its brackets perfectly nested.",
      },
      {
        slug: "the-vault-countdown",
        missionNumber: 4,
        missionTitle: "The Vault Countdown",
        storyIntro:
          "The vault reseals in minutes. Find the best window of opportunity before it's gone for good.",
      },
    ],
  },
  {
    id: "the-haunted-network",
    chapterNumber: 2,
    title: "The Haunted Network",
    tagline: "Something is moving through the servers after dark.",
    storyDescription:
      "A cybersecurity team traces an intrusion crawling through a company's network at 2 AM — clustering across machines, hiding in patch logs, rerouting signals meant for someone else.",
    theme: "cyber",
    color: "cyan",
    icon: "Radar",
    difficulty: "Intermediate",
    estimatedTime: { low: 1.5, high: 2.5, unit: "hours" },
    unlockRequirement: { chapterId: "the-missing-cipher" },
    comingSoon: false,
    missions: [
      {
        slug: "trace-the-intrusion",
        missionNumber: 1,
        missionTitle: "Trace the Intrusion",
        storyIntro:
          "The network map lights up with infected nodes. Group them into clusters before the intrusion spreads further.",
      },
      {
        slug: "firewall-breach-order",
        missionNumber: 2,
        missionTitle: "Firewall Breach Order",
        storyIntro:
          "A queue of security patches is stuck — something in the dependency chain doesn't add up.",
      },
      {
        slug: "signal-decoder",
        missionNumber: 3,
        missionTitle: "Signal Decoder",
        storyIntro:
          "An intercepted signal chain reads backwards. Reverse it to decode what's actually being sent.",
      },
      {
        slug: "the-last-firewall",
        missionNumber: 4,
        missionTitle: "The Last Firewall",
        storyIntro:
          "One breach timestamp is buried in months of sorted server logs. Find it before the trail goes cold.",
      },
    ],
  },
  {
    id: "escape-velocity",
    chapterNumber: 3,
    title: "Escape Velocity",
    tagline: "The launch window is closing.",
    storyDescription:
      "A crew stranded on a failing station has one shot at a launch window. Every system check between now and ignition has to hold.",
    theme: "space",
    color: "sky",
    icon: "Rocket",
    difficulty: "Intermediate",
    estimatedTime: { low: 2, high: 3, unit: "hours" },
    unlockRequirement: { chapterId: "the-haunted-network" },
    comingSoon: true,
    plannedMissionCount: 4,
    missions: [],
  },
  {
    id: "the-kings-vault",
    chapterNumber: 4,
    title: "The King's Vault",
    tagline: "Gold, riddles, and a kingdom's oldest trap.",
    storyDescription:
      "Deep beneath an ancient kingdom, a vault built on logic puzzles guards a fortune no one has claimed in a hundred years.",
    theme: "kingdom",
    color: "amber",
    icon: "Crown",
    difficulty: "Advanced",
    estimatedTime: { low: 2, high: 3, unit: "hours" },
    unlockRequirement: { chapterId: "escape-velocity" },
    comingSoon: true,
    plannedMissionCount: 4,
    missions: [],
  },
  {
    id: "operation-black-box",
    chapterNumber: 5,
    title: "Operation Black Box",
    tagline: "Trust no signal. Verify everything.",
    storyDescription:
      "A secret agent goes dark mid-mission. The only way to finish the job is to think exactly like the system that's hunting you.",
    theme: "agent",
    color: "rose",
    icon: "ShieldEllipsis",
    difficulty: "Advanced",
    estimatedTime: { low: 2, high: 3, unit: "hours" },
    unlockRequirement: { chapterId: "the-kings-vault" },
    comingSoon: true,
    plannedMissionCount: 4,
    missions: [],
  },
];

export default codeClubEdition;