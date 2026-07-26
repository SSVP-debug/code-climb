// The narrative spine of the letter-journey experience: six sentences,
// each with one "hero word". Certain letters in that word are "tracked" —
// they're the ones that eventually spell CODECLUB — and get an accent
// color so the reader notices them without any per-letter animation.
//
// The actual motion is scroll-scrubbed (see LetterJourney.jsx): every
// value is a continuous function of scroll position, nothing is timer- or
// state-driven, so it can never desync from the scroll gesture or get
// caught mid-transition.

function word(chars, roleByIndex) {
  return chars.split("").map((char, i) => ({
    char,
    tracked: Boolean(roleByIndex[i]),
  }));
}

export const LETTER_JOURNEY_FRAMES = [
  {
    id: "curriculum",
    before: "A strong",
    word: word("CURRICULUM", { 0: true, 6: true }),
    after: "lays the foundation for lifelong learning.",
  },
  {
    id: "continue",
    before: "",
    word: word("CONTINUE", { 0: true, 1: true, 6: true }),
    after: "your journey with a curriculum designed for real growth.",
  },
  {
    id: "coagulum",
    before: "Like a",
    word: word("COAGULUM", { 0: true, 1: true, 5: true, 6: true }),
    after: "great achievements are built by bringing small efforts together.",
  },
  {
    id: "blueprint",
    before: "Every",
    word: word("BLUEPRINT", { 0: true }),
    after: "begins with a single solved problem.",
  },
  {
    id: "club",
    before: "A",
    word: word("CLUB", { 0: true, 1: true, 2: true, 3: true }),
    after: "is where learning meets community.",
  },
  {
    id: "codeclub",
    before: "",
    word: word("CODECLUB", { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true }),
    after: "",
    final: true,
    tagline: "Where every solved problem builds your future.",
  },
];

// The accumulation stage: the eight letters of CODECLUB, in their final
// left-to-right order, each tagged with the frame (0-indexed) whose
// sentence first "earns" it. A letter fades into its slot once scroll
// passes that frame — and, being a pure function of scroll position,
// fades back out just as smoothly if the user scrolls back up.
export const CODECLUB_SLOTS = [
  { char: "C", introFrame: 5 }, // new C that opens "CODE"
  { char: "O", introFrame: 1 }, // from CONTINUE
  { char: "D", introFrame: 5 },
  { char: "E", introFrame: 5 },
  { char: "C", introFrame: 0 }, // from CURRICULUM
  { char: "L", introFrame: 2 }, // from COAGULUM
  { char: "U", introFrame: 0 }, // from CURRICULUM
  { char: "B", introFrame: 3 }, // from BLUEPRINT
];

export const LETTER_JOURNEY_TRANSCRIPT = [
  "A strong CURRICULUM lays the foundation for lifelong learning.",
  "CONTINUE your journey with a curriculum designed for real growth.",
  "Like a COAGULUM, great achievements are built by bringing small efforts together.",
  "Every BLUEPRINT begins with a single solved problem.",
  "A CLUB is where learning meets community.",
  "CODECLUB — where every solved problem builds your future.",
];