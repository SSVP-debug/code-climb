/**
 * problemMetadata.js
 *
 * Supplementary metadata for every problem in the catalog.
 * Keyed by slug. Merged into each problem object in problems.js.
 *
 * Fields:
 *   pattern         — algorithmic pattern this problem teaches
 *   estimatedTime   — rough time budget for a prepared candidate
 *   companies       — companies known to ask this in interviews
 *   relatedProblems — slugs of thematically linked problems on this platform
 *   hints           — progressive hints: { level: number, text: string }
 *                     ordered from most vague (level 1) to most specific
 */

const problemMetadata = {

  // ── ARRAYS ─────────────────────────────────────────────────────────────────

  "two-sum": {
    pattern: "hash map complement",
    estimatedTime: "10–15 min",
    companies: ["Google", "Amazon", "Facebook", "Apple", "Microsoft"],
    relatedProblems: ["two-sum-ii-sorted", "two-sum-count-pairs", "three-sum"],
    hints: [
      { level: 1, text: "A brute-force nested loop works in O(n²). Can you do better?" },
      { level: 2, text: "For each number, you need target − num. How can you check that in O(1)?" },
      { level: 3, text: "A hash map lets you look up any complement in O(1) as you iterate." },
      { level: 4, text: "One pass: for each num check if (target − num) is already in the map, then store num → index." },
    ],
  },

  "contains-duplicate": {
    pattern: "hash set",
    estimatedTime: "5–10 min",
    companies: ["Amazon", "Apple", "Google", "Bloomberg"],
    relatedProblems: ["single-number", "valid-anagram", "longest-consecutive-sequence"],
    hints: [
      { level: 1, text: "Sorting puts duplicates adjacent — that's one valid approach." },
      { level: 2, text: "Can you detect a duplicate in a single pass without sorting?" },
      { level: 3, text: "A hash set only stores unique values. Inserting a duplicate tells you the answer immediately." },
    ],
  },

  "best-time-to-buy-and-sell-stock": {
    pattern: "sliding window / greedy",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Facebook", "Goldman Sachs", "Bloomberg", "Microsoft"],
    relatedProblems: ["maximum-subarray", "maximum-average-subarray", "move-zeroes"],
    hints: [
      { level: 1, text: "You want to maximize profit = sell_price − buy_price, where the buy day comes first." },
      { level: 2, text: "One pass: track the minimum price seen so far and compute profit at each step." },
      { level: 3, text: "At each index ask: 'If I sell today, what's my profit given the cheapest day before this one?'" },
    ],
  },

  "maximum-subarray": {
    pattern: "kadane's algorithm",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Microsoft", "LinkedIn", "Apple", "Google"],
    relatedProblems: ["best-time-to-buy-and-sell-stock", "house-robber", "climbing-stairs"],
    hints: [
      { level: 1, text: "Try every possible subarray — O(n²). Now think about eliminating recomputation." },
      { level: 2, text: "Kadane's insight: if the running sum goes negative, restart it. A negative prefix only hurts future sums." },
      { level: 3, text: "Two variables: current_sum (reset to 0 when negative) and max_sum (best seen so far). Update max_sum each step." },
    ],
  },

  "majority-element": {
    pattern: "boyer-moore voting",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Apple", "Yahoo", "Adobe"],
    relatedProblems: ["single-number", "contains-duplicate", "maximum-subarray"],
    hints: [
      { level: 1, text: "A hash map of counts is a straightforward O(n) solution." },
      { level: 2, text: "Can you solve it in O(1) space? The majority element appears more than n/2 times — that's a strong constraint." },
      { level: 3, text: "Boyer-Moore Voting: maintain a candidate and a counter. Matching element increments; different element decrements. When counter hits zero, switch candidates." },
    ],
  },

  "move-zeroes": {
    pattern: "two pointers",
    estimatedTime: "5–10 min",
    companies: ["Facebook", "Bloomberg", "Microsoft"],
    relatedProblems: ["contains-duplicate", "two-sum-ii-sorted", "reverse-string"],
    hints: [
      { level: 1, text: "Two-pass: collect all non-zeroes, write them back, then fill the rest with zeros." },
      { level: 2, text: "Can you do it in one pass in-place?" },
      { level: 3, text: "Write pointer: advance it only when you place a non-zero. Everything to its right stays zero." },
    ],
  },

  // ── STACKS ─────────────────────────────────────────────────────────────────

  "valid-parentheses": {
    pattern: "stack matching",
    estimatedTime: "10–15 min",
    companies: ["Google", "Amazon", "Facebook", "Microsoft", "Bloomberg"],
    relatedProblems: ["min-stack", "daily-temperatures"],
    hints: [
      { level: 1, text: "A closing bracket must match the most recently opened one — that's exactly what a stack tracks." },
      { level: 2, text: "Push every opening bracket. On a closing bracket, check if the top of the stack is its matching opener." },
      { level: 3, text: "At the end, the stack must be empty for the string to be valid." },
    ],
  },

  "min-stack": {
    pattern: "auxiliary stack",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Google", "Apple", "Bloomberg"],
    relatedProblems: ["valid-parentheses", "daily-temperatures", "kth-largest-element"],
    hints: [
      { level: 1, text: "A regular stack gives O(1) push/pop. The challenge is getMin in O(1)." },
      { level: 2, text: "When you push a value, also record what the minimum was at that moment." },
      { level: 3, text: "Use a second 'min stack' that mirrors the main stack. Pop both together — each level remembers its own minimum." },
    ],
  },

  "daily-temperatures": {
    pattern: "monotonic stack",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Google", "Uber", "Facebook"],
    relatedProblems: ["valid-parentheses", "min-stack", "trapping-rain-water"],
    hints: [
      { level: 1, text: "For each day, find the first future day that is warmer. Brute force is O(n²)." },
      { level: 2, text: "Think about storing indices of 'unresolved' days — days that haven't found a warmer future day yet." },
      { level: 3, text: "Monotonic decreasing stack: push indices. When you see a warmer temperature, pop and record the gap as the answer for that index." },
    ],
  },

  // ── LINKED LIST ────────────────────────────────────────────────────────────

  "reverse-linked-list": {
    pattern: "iteration / recursion",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Microsoft", "Apple", "Facebook", "Adobe"],
    relatedProblems: ["merge-two-sorted-lists", "middle-of-the-linked-list", "remove-nth-node-from-end"],
    hints: [
      { level: 1, text: "Draw a three-node list and think about which pointer changes are needed at each step." },
      { level: 2, text: "You must save the next node before you overwrite the current node's next pointer." },
      { level: 3, text: "Three pointers: prev (null), curr (head), next. At each step: save next, set curr.next = prev, advance prev and curr." },
    ],
  },

  "merge-two-sorted-lists": {
    pattern: "two pointers",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Google", "Microsoft", "Bloomberg"],
    relatedProblems: ["reverse-linked-list", "middle-of-the-linked-list", "remove-nth-node-from-end"],
    hints: [
      { level: 1, text: "Think about how you'd merge two sorted arrays — same concept, different structure." },
      { level: 2, text: "A dummy head node simplifies edge cases — you always have a node to attach the next result to." },
      { level: 3, text: "Compare the two current heads, attach the smaller, advance that list's pointer. Attach any remaining nodes at the end." },
    ],
  },

  "middle-of-the-linked-list": {
    pattern: "fast / slow pointer",
    estimatedTime: "5–10 min",
    companies: ["Amazon", "Facebook", "Microsoft"],
    relatedProblems: ["reverse-linked-list", "remove-nth-node-from-end", "merge-two-sorted-lists"],
    hints: [
      { level: 1, text: "Count the length then walk to n/2. That's two passes — can you do it in one?" },
      { level: 2, text: "Two pointers moving at different speeds will naturally separate at the midpoint." },
      { level: 3, text: "Fast moves 2 steps, slow moves 1. When fast reaches the end, slow is at the middle." },
    ],
  },

  "remove-nth-node-from-end": {
    pattern: "fast / slow pointer",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Microsoft", "Apple", "Google"],
    relatedProblems: ["middle-of-the-linked-list", "reverse-linked-list", "merge-two-sorted-lists"],
    hints: [
      { level: 1, text: "Find the length, then walk to (length − n). That's two passes — can you do it in one?" },
      { level: 2, text: "If fast is n steps ahead of slow, when fast reaches the end, slow is just before the target node." },
      { level: 3, text: "Start fast n+1 steps ahead (using a dummy head). When fast hits null, slow.next is the node to remove." },
    ],
  },

  // ── TWO POINTERS ───────────────────────────────────────────────────────────

  "container-with-most-water": {
    pattern: "two pointers",
    estimatedTime: "15–20 min",
    companies: ["Google", "Amazon", "Goldman Sachs", "Facebook"],
    relatedProblems: ["trapping-rain-water", "two-sum-ii-sorted", "three-sum"],
    hints: [
      { level: 1, text: "Brute force checks all pairs — O(n²). The area is limited by the shorter of the two walls." },
      { level: 2, text: "Start with the widest container (both ends). Which pointer should you move to potentially find more water?" },
      { level: 3, text: "Always move the pointer at the shorter wall inward. Moving the taller wall can only decrease or maintain area — never increase it." },
    ],
  },

  "trapping-rain-water": {
    pattern: "two pointers",
    estimatedTime: "20–30 min",
    companies: ["Amazon", "Google", "Facebook", "Bloomberg", "Goldman Sachs"],
    relatedProblems: ["container-with-most-water", "daily-temperatures", "maximum-subarray"],
    hints: [
      { level: 1, text: "Water above position i is min(maxLeft[i], maxRight[i]) − height[i]. Can you precompute those arrays?" },
      { level: 2, text: "That's O(n) time and O(n) space. Can you eliminate the extra arrays?" },
      { level: 3, text: "Two-pointer: maintain left_max and right_max as you converge inward. The smaller side determines the water level at each step." },
    ],
  },

  "two-sum-ii-sorted": {
    pattern: "two pointers",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Microsoft", "Adobe"],
    relatedProblems: ["two-sum", "three-sum", "container-with-most-water"],
    hints: [
      { level: 1, text: "The array is already sorted. How does that property help narrow your search?" },
      { level: 2, text: "Two pointers at opposite ends: sum too large → move right pointer left; too small → move left pointer right." },
      { level: 3, text: "Because exactly one solution is guaranteed, the pointers will always converge on it without extra checks." },
    ],
  },

  "three-sum": {
    pattern: "sort + two pointers",
    estimatedTime: "20–25 min",
    companies: ["Amazon", "Facebook", "Google", "Microsoft", "Apple"],
    relatedProblems: ["two-sum", "two-sum-ii-sorted", "container-with-most-water"],
    hints: [
      { level: 1, text: "Brute force tries all triples — O(n³). Fix one element and the problem reduces to Two Sum." },
      { level: 2, text: "Sort first. For each index i, run the sorted two-sum approach on the subarray to the right." },
      { level: 3, text: "Skip duplicate values of i, and skip duplicates at the left/right pointers after each match to avoid duplicate triplets." },
    ],
  },

  // ── SLIDING WINDOW ─────────────────────────────────────────────────────────

  "longest-substring-without-repeating-characters": {
    pattern: "sliding window",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Bloomberg", "Google", "Facebook", "Microsoft"],
    relatedProblems: ["minimum-size-subarray-sum", "maximum-average-subarray", "longest-consecutive-sequence"],
    hints: [
      { level: 1, text: "Brute force checks every substring — O(n²) or worse. Think about maintaining a window of valid characters." },
      { level: 2, text: "Expand the window by moving right. When you hit a duplicate, shrink from the left." },
      { level: 3, text: "A hash map of character → last-seen index lets you jump the left pointer directly past the duplicate instead of crawling." },
    ],
  },

  "minimum-size-subarray-sum": {
    pattern: "sliding window",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Facebook", "Adobe"],
    relatedProblems: ["longest-substring-without-repeating-characters", "maximum-average-subarray", "maximum-subarray"],
    hints: [
      { level: 1, text: "You need the shortest contiguous subarray with sum ≥ target." },
      { level: 2, text: "Expand by advancing the right pointer. Once the sum qualifies, try shrinking from the left." },
      { level: 3, text: "Each time the constraint is satisfied, record the window length. Keep shrinking left while it still holds." },
    ],
  },

  "maximum-average-subarray": {
    pattern: "fixed-size sliding window",
    estimatedTime: "10–15 min",
    companies: ["Google", "Amazon", "Adobe"],
    relatedProblems: ["minimum-size-subarray-sum", "maximum-subarray", "best-time-to-buy-and-sell-stock"],
    hints: [
      { level: 1, text: "The window size is fixed at k — this is simpler than a variable-size window." },
      { level: 2, text: "Compute the sum of the first k elements. Then slide right: add the incoming element, subtract the outgoing one." },
      { level: 3, text: "Track the maximum sum seen across all windows; divide by k at the end to get the average." },
    ],
  },

  // ── BINARY SEARCH ──────────────────────────────────────────────────────────

  "binary-search": {
    pattern: "binary search",
    estimatedTime: "10–15 min",
    companies: ["Google", "Amazon", "Microsoft", "Apple"],
    relatedProblems: ["find-minimum-in-rotated-sorted-array", "search-in-rotated-sorted-array", "kth-largest-element"],
    hints: [
      { level: 1, text: "Linear scan is O(n). The array is sorted — you can eliminate half the search space each step." },
      { level: 2, text: "Check the midpoint. Is the target in the left half or the right half?" },
      { level: 3, text: "Carefully define your loop invariant: lo <= hi or lo < hi, and decide whether mid goes left or right on each branch." },
    ],
  },

  "find-minimum-in-rotated-sorted-array": {
    pattern: "binary search",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Microsoft", "LinkedIn", "Uber"],
    relatedProblems: ["binary-search", "search-in-rotated-sorted-array"],
    hints: [
      { level: 1, text: "Linear scan trivially finds the minimum. Binary search should reach O(log n)." },
      { level: 2, text: "Key insight: in any rotation, at least one half of the array is fully sorted." },
      { level: 3, text: "If nums[mid] > nums[right], the minimum is in the right half. Otherwise it's in the left half (including mid)." },
    ],
  },

  "search-in-rotated-sorted-array": {
    pattern: "binary search",
    estimatedTime: "20–25 min",
    companies: ["Amazon", "Microsoft", "Facebook", "Google", "Uber"],
    relatedProblems: ["binary-search", "find-minimum-in-rotated-sorted-array"],
    hints: [
      { level: 1, text: "You could find the pivot first, then binary search the appropriate half. That's two binary searches." },
      { level: 2, text: "One binary search works: at any mid, determine which side is fully sorted." },
      { level: 3, text: "If the target falls within the sorted side, search there. Otherwise search the unsorted side. Decide this by comparing target to the endpoints of each half." },
    ],
  },

  // ── HASHING ────────────────────────────────────────────────────────────────

  "valid-anagram": {
    pattern: "frequency count",
    estimatedTime: "5–10 min",
    companies: ["Amazon", "Facebook", "Google", "Microsoft"],
    relatedProblems: ["group-anagrams", "longest-consecutive-sequence", "contains-duplicate"],
    hints: [
      { level: 1, text: "Two strings are anagrams if they have the same characters with the same frequencies." },
      { level: 2, text: "Sorting both and comparing is simple but O(n log n). Can you do O(n)?" },
      { level: 3, text: "A frequency map (or 26-slot array for lowercase letters) lets you compare in O(n) time and O(1) space." },
    ],
  },

  "group-anagrams": {
    pattern: "frequency count",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Facebook", "Apple", "Bloomberg"],
    relatedProblems: ["valid-anagram", "longest-consecutive-sequence", "two-sum"],
    hints: [
      { level: 1, text: "You need a canonical form that all anagrams of the same word share." },
      { level: 2, text: "Sorting each string gives a canonical key — anagrams always sort to the same characters." },
      { level: 3, text: "Group strings by their sorted key in a hash map. The values are the anagram groups." },
    ],
  },

  "longest-consecutive-sequence": {
    pattern: "hash set",
    estimatedTime: "20–25 min",
    companies: ["Google", "Facebook", "Amazon", "Bloomberg"],
    relatedProblems: ["valid-anagram", "group-anagrams", "contains-duplicate"],
    hints: [
      { level: 1, text: "Sorting gives an O(n log n) solution. Can you reach O(n)?" },
      { level: 2, text: "Put all numbers in a hash set for O(1) membership checks." },
      { level: 3, text: "Only start counting a sequence from its smallest element — i.e., when num−1 is NOT in the set. This ensures each sequence is counted exactly once." },
    ],
  },

  "two-sum-count-pairs": {
    pattern: "hash map complement",
    estimatedTime: "10–15 min",
    companies: ["Google", "Amazon"],
    relatedProblems: ["two-sum", "two-sum-ii-sorted", "three-sum"],
    hints: [
      { level: 1, text: "Unlike classic Two Sum, you need to count all valid pairs, not just find the first one." },
      { level: 2, text: "Keep a running map of how many times you've seen each number so far." },
      { level: 3, text: "For each num, the complement is target − num. The count of new pairs equals map[complement]. Update the map after counting." },
    ],
  },

  // ── STRINGS ────────────────────────────────────────────────────────────────

  "longest-common-prefix": {
    pattern: "vertical scanning",
    estimatedTime: "5–10 min",
    companies: ["Amazon", "Google", "Adobe"],
    relatedProblems: ["valid-anagram", "reverse-string", "is-palindrome"],
    hints: [
      { level: 1, text: "Start with the first string as your candidate prefix." },
      { level: 2, text: "For each subsequent string, shorten the prefix until that string starts with it." },
      { level: 3, text: "If the prefix ever becomes empty, return \"\". No further shortening is possible." },
    ],
  },

  "reverse-string": {
    pattern: "two pointers",
    estimatedTime: "5 min",
    companies: ["Amazon", "Microsoft", "Apple"],
    relatedProblems: ["is-palindrome", "move-zeroes", "reverse-linked-list"],
    hints: [
      { level: 1, text: "In-place means modify the input array directly without allocating a new one." },
      { level: 2, text: "Two pointers at each end, swapping and moving inward until they meet." },
    ],
  },

  "is-palindrome": {
    pattern: "two pointers",
    estimatedTime: "5–10 min",
    companies: ["Facebook", "Microsoft", "Amazon"],
    relatedProblems: ["reverse-string", "longest-common-prefix", "valid-anagram"],
    hints: [
      { level: 1, text: "Filter out non-alphanumeric characters and lowercase everything first." },
      { level: 2, text: "Then check if the cleaned string equals its reverse." },
      { level: 3, text: "Or use two pointers from each end, skipping invalid characters in-place to avoid allocating a cleaned copy." },
    ],
  },

  // ── DYNAMIC PROGRAMMING ────────────────────────────────────────────────────

  "climbing-stairs": {
    pattern: "1d dp / fibonacci",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Google", "Apple", "Adobe"],
    relatedProblems: ["fibonacci-number", "house-robber", "coin-change"],
    hints: [
      { level: 1, text: "How many ways are there to reach step n? Think about which step you arrived from." },
      { level: 2, text: "You can only come from step n−1 or step n−2, so ways(n) = ways(n−1) + ways(n−2)." },
      { level: 3, text: "This is Fibonacci. You only need the last two values at any time — O(1) space." },
    ],
  },

  "fibonacci-number": {
    pattern: "1d dp / memoization",
    estimatedTime: "5–10 min",
    companies: ["Amazon", "Apple", "Google"],
    relatedProblems: ["climbing-stairs", "house-robber"],
    hints: [
      { level: 1, text: "Naive recursion recomputes the same subproblems exponentially. Can you cache results?" },
      { level: 2, text: "Memoization (top-down) or tabulation (bottom-up) both reduce it to O(n)." },
      { level: 3, text: "You only ever need the previous two values, so the space can be reduced to O(1)." },
    ],
  },

  "house-robber": {
    pattern: "1d dp",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Google", "Adobe", "Airbnb"],
    relatedProblems: ["climbing-stairs", "coin-change", "maximum-subarray"],
    hints: [
      { level: 1, text: "At each house you either rob it (skipping the previous) or skip it (keeping the best from the previous)." },
      { level: 2, text: "dp[i] = max(dp[i−1], dp[i−2] + nums[i])." },
      { level: 3, text: "You only need the last two values — reduce space to O(1) with two variables." },
    ],
  },

  "coin-change": {
    pattern: "unbounded knapsack",
    estimatedTime: "20–25 min",
    companies: ["Amazon", "Google", "Microsoft", "Goldman Sachs"],
    relatedProblems: ["climbing-stairs", "house-robber", "word-break"],
    hints: [
      { level: 1, text: "Greedy (always pick the largest coin) fails for arbitrary denominations. Think DP." },
      { level: 2, text: "For each amount from 1 to target: dp[amount] = min(dp[amount], dp[amount − coin] + 1) for each valid coin." },
      { level: 3, text: "Initialize dp[0] = 0, all others to Infinity. If dp[target] is still Infinity, return −1." },
    ],
  },

  "word-break": {
    pattern: "1d dp / memoization",
    estimatedTime: "20–25 min",
    companies: ["Amazon", "Google", "Facebook", "Bloomberg"],
    relatedProblems: ["coin-change", "decode-ways", "climbing-stairs"],
    hints: [
      { level: 1, text: "If s[0..i] is breakable and s[i+1..j] is in the dictionary, then s[0..j] is breakable." },
      { level: 2, text: "dp[i] = true if s[0..i−1] can be segmented. For each i, try every j < i where dp[j] is true and s[j..i−1] is a valid word." },
      { level: 3, text: "Store dictionary words in a set for O(1) lookup. Total complexity: O(n²)." },
    ],
  },

  "decode-ways": {
    pattern: "1d dp",
    estimatedTime: "20–25 min",
    companies: ["Facebook", "Amazon", "Microsoft", "Google"],
    relatedProblems: ["climbing-stairs", "word-break", "fibonacci-number"],
    hints: [
      { level: 1, text: "A single digit decodes if it's 1–9. Two digits decode if they form 10–26." },
      { level: 2, text: "dp[i] = number of ways to decode s[0..i−1]. At each position, check one-digit and two-digit decodings separately." },
      { level: 3, text: "Leading zeros are invalid: '06' is NOT a valid encoding of F. Guard against s[i] === '0' for single-digit, and s[i..i+1] outside 10–26 for two-digit." },
    ],
  },

  // ── GREEDY ─────────────────────────────────────────────────────────────────

  "jump-game-ii": {
    pattern: "greedy bfs",
    estimatedTime: "20–25 min",
    companies: ["Amazon", "Google", "Microsoft"],
    relatedProblems: ["maximum-subarray", "house-robber", "coin-change"],
    hints: [
      { level: 1, text: "Think BFS level-by-level: each level is the set of positions reachable in exactly k jumps." },
      { level: 2, text: "Greedily, from your current reachable range, find the farthest position the next jump can reach." },
      { level: 3, text: "Track: current range end, farthest reachable, and jump count. When you step past the current end, increment jumps and extend the range." },
    ],
  },

  // ── HEAP ───────────────────────────────────────────────────────────────────

  "kth-largest-element": {
    pattern: "min-heap of size k",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Facebook", "Google", "LinkedIn"],
    relatedProblems: ["last-stone-weight", "binary-search"],
    hints: [
      { level: 1, text: "Sorting works in O(n log n) and gives you any kth element trivially." },
      { level: 2, text: "A min-heap of size k maintains the k largest elements seen so far. Its root is the kth largest." },
      { level: 3, text: "For each element: push it onto the heap. If the heap exceeds size k, pop the minimum. The root is the answer after iterating." },
    ],
  },

  "last-stone-weight": {
    pattern: "max-heap",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Google"],
    relatedProblems: ["kth-largest-element", "minimum-size-subarray-sum"],
    hints: [
      { level: 1, text: "At each step you need the two heaviest stones. A max-heap gives you the largest in O(log n)." },
      { level: 2, text: "Most languages only provide min-heaps. Simulate a max-heap by negating all values." },
      { level: 3, text: "Repeat: pop two largest, if unequal push back the difference, until one or zero stones remain." },
    ],
  },

  // ── BACKTRACKING ───────────────────────────────────────────────────────────

  "subsets": {
    pattern: "backtracking",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Facebook", "Google", "Bloomberg"],
    relatedProblems: ["combination-sum", "letter-case-permutations"],
    hints: [
      { level: 1, text: "There are 2^n subsets — each element is either included or excluded." },
      { level: 2, text: "Backtracking: at each index branch — include this element or skip it — and recurse." },
      { level: 3, text: "Iterative approach: start with [[]]. For each element, create a new subset from every existing one that includes it." },
    ],
  },

  "combination-sum": {
    pattern: "backtracking",
    estimatedTime: "20–25 min",
    companies: ["Amazon", "Google", "Facebook", "Microsoft"],
    relatedProblems: ["subsets", "letter-case-permutations", "coin-change"],
    hints: [
      { level: 1, text: "Backtracking: at each step choose a candidate (can reuse it) or advance to the next." },
      { level: 2, text: "Sort first so you can prune: if the current candidate exceeds the remaining target, stop that branch." },
      { level: 3, text: "Pass the remaining sum down. Add to results when it reaches exactly zero." },
    ],
  },

  "letter-case-permutations": {
    pattern: "backtracking",
    estimatedTime: "15–20 min",
    companies: ["Facebook", "Amazon"],
    relatedProblems: ["subsets", "combination-sum"],
    hints: [
      { level: 1, text: "At each character: digits have one choice, letters have two (uppercase or lowercase)." },
      { level: 2, text: "Backtracking: build the result character by character, branching at each letter." },
      { level: 3, text: "Iterative: for each existing string in your results, when you reach a letter, add both-case variants." },
    ],
  },

  // ── TREES ──────────────────────────────────────────────────────────────────

  "maximum-depth-of-binary-tree": {
    pattern: "dfs",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "LinkedIn", "Apple", "Google"],
    relatedProblems: ["invert-binary-tree", "diameter-of-binary-tree", "same-tree"],
    hints: [
      { level: 1, text: "The depth of a tree is 1 + the maximum depth of its two subtrees." },
      { level: 2, text: "That definition is naturally recursive. Base case: a null node has depth 0." },
      { level: 3, text: "BFS (level-order) also works and avoids recursion: depth equals the number of levels traversed." },
    ],
  },

  "invert-binary-tree": {
    pattern: "dfs",
    estimatedTime: "10–15 min",
    companies: ["Google", "Amazon", "Apple"],
    relatedProblems: ["maximum-depth-of-binary-tree", "same-tree", "diameter-of-binary-tree"],
    hints: [
      { level: 1, text: "Swap the children of the root, then recursively invert each subtree." },
      { level: 2, text: "DFS (pre-order or post-order) both work. So does BFS." },
      { level: 3, text: "Base case: null node — return null immediately." },
    ],
  },

  "diameter-of-binary-tree": {
    pattern: "dfs",
    estimatedTime: "15–20 min",
    companies: ["Facebook", "Amazon", "Google"],
    relatedProblems: ["maximum-depth-of-binary-tree", "invert-binary-tree", "validate-binary-search-tree"],
    hints: [
      { level: 1, text: "The diameter through a node is leftHeight + rightHeight. But the longest path might not pass through the root." },
      { level: 2, text: "DFS returning height: at each node, update a global max with left_height + right_height." },
      { level: 3, text: "The helper function returns height (not diameter) so the parent can compute its own candidate diameter." },
    ],
  },

  "validate-binary-search-tree": {
    pattern: "dfs with bounds",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Microsoft", "Facebook", "Bloomberg"],
    relatedProblems: ["diameter-of-binary-tree", "same-tree", "maximum-depth-of-binary-tree"],
    hints: [
      { level: 1, text: "Checking left < root < right locally is not enough — the entire left subtree must be less than root." },
      { level: 2, text: "Pass valid min/max bounds down the recursion. A node must satisfy min < node.val < max." },
      { level: 3, text: "When going left, the new max is the current node's value. When going right, the new min is the current node's value." },
    ],
  },

  "same-tree": {
    pattern: "dfs",
    estimatedTime: "5–10 min",
    companies: ["Amazon", "Bloomberg"],
    relatedProblems: ["invert-binary-tree", "maximum-depth-of-binary-tree", "validate-binary-search-tree"],
    hints: [
      { level: 1, text: "Two trees are the same if their root values match and both subtrees are the same." },
      { level: 2, text: "Recursive base cases: both null → true; one null → false; values differ → false." },
    ],
  },

  // ── GRAPHS ─────────────────────────────────────────────────────────────────

  "flood-fill": {
    pattern: "dfs on grid",
    estimatedTime: "10–15 min",
    companies: ["Amazon", "Facebook", "Google"],
    relatedProblems: ["number-of-islands", "maximum-depth-of-binary-tree"],
    hints: [
      { level: 1, text: "From the source pixel, spread to all 4-directionally connected pixels that share the original color." },
      { level: 2, text: "DFS or BFS both work. Mark pixels as visited as you go to avoid revisiting." },
      { level: 3, text: "Edge case: if the source pixel already has the new color, return the image immediately to avoid infinite loops." },
    ],
  },

  "number-of-islands": {
    pattern: "dfs / bfs on grid",
    estimatedTime: "15–20 min",
    companies: ["Amazon", "Google", "Facebook", "Bloomberg", "Microsoft"],
    relatedProblems: ["flood-fill", "maximum-depth-of-binary-tree"],
    hints: [
      { level: 1, text: "Each island is a connected group of '1' cells. You need to count separate groups." },
      { level: 2, text: "DFS/BFS from any unvisited '1': mark all connected land as visited. Each DFS = one island." },
      { level: 3, text: "Mark visited cells as '0' in-place to avoid an extra visited array." },
    ],
  },

  // ── BIT MANIPULATION ───────────────────────────────────────────────────────

  "single-number": {
    pattern: "xor",
    estimatedTime: "5–10 min",
    companies: ["Amazon", "Apple", "Google", "Facebook"],
    relatedProblems: ["contains-duplicate", "majority-element"],
    hints: [
      { level: 1, text: "A hash map of counts is straightforward. Can you do it with O(1) space?" },
      { level: 2, text: "XOR properties: a ^ a = 0, and a ^ 0 = a. Order doesn't matter." },
      { level: 3, text: "XOR all numbers together. Every pair cancels to 0 and only the single number survives." },
    ],
  },

};

export default problemMetadata;
