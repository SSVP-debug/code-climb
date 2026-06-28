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

  "product-of-array-except-self": {
    pattern: "prefix product",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the prefix product approach for arrays problems." },
      { level: 2, text: "Can you solve Product of Array Except Self in O(n log n) or better? Consider how prefix product helps." },
      { level: 3, text: "The optimal solution uses prefix product. Work through small examples to see the pattern." },
    ],
  },

  "find-all-duplicates-in-array": {
    pattern: "index marking",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the index marking approach for arrays problems." },
      { level: 2, text: "Can you solve Find All Duplicates in an Array in O(n log n) or better? Consider how index marking helps." },
      { level: 3, text: "The optimal solution uses index marking. Work through small examples to see the pattern." },
    ],
  },

  "rotate-array": {
    pattern: "reverse trick",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the reverse trick approach for arrays problems." },
      { level: 2, text: "Can you solve Rotate Array in O(n log n) or better? Consider how reverse trick helps." },
      { level: 3, text: "The optimal solution uses reverse trick. Work through small examples to see the pattern." },
    ],
  },

  "sort-colors": {
    pattern: "dutch national flag",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the dutch national flag approach for arrays problems." },
      { level: 2, text: "Can you solve Sort Colors in O(n log n) or better? Consider how dutch national flag helps." },
      { level: 3, text: "The optimal solution uses dutch national flag. Work through small examples to see the pattern." },
    ],
  },

  "next-permutation": {
    pattern: "in-place rearrangement",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the in-place rearrangement approach for arrays problems." },
      { level: 2, text: "Can you solve Next Permutation in O(n log n) or better? Consider how in-place rearrangement helps." },
      { level: 3, text: "The optimal solution uses in-place rearrangement. Work through small examples to see the pattern." },
    ],
  },

  "longest-palindromic-substring": {
    pattern: "expand around center",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the expand around center approach for strings problems." },
      { level: 2, text: "Can you solve Longest Palindromic Substring in O(n log n) or better? Consider how expand around center helps." },
      { level: 3, text: "The optimal solution uses expand around center. Work through small examples to see the pattern." },
    ],
  },

  "string-to-integer-atoi": {
    pattern: "string parsing",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the string parsing approach for strings problems." },
      { level: 2, text: "Can you solve String to Integer (atoi) in O(n log n) or better? Consider how string parsing helps." },
      { level: 3, text: "The optimal solution uses string parsing. Work through small examples to see the pattern." },
    ],
  },

  "count-and-say": {
    pattern: "simulation",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the simulation approach for strings problems." },
      { level: 2, text: "Can you solve Count and Say in O(n log n) or better? Consider how simulation helps." },
      { level: 3, text: "The optimal solution uses simulation. Work through small examples to see the pattern." },
    ],
  },

  "minimum-window-substring": {
    pattern: "sliding window with frequency map",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sliding window with frequency map approach for sliding window problems." },
      { level: 2, text: "Can you solve Minimum Window Substring in O(n log n) or better? Consider how sliding window with frequency map helps." },
      { level: 3, text: "The optimal solution uses sliding window with frequency map. Work through small examples to see the pattern." },
    ],
  },

  "encode-and-decode-strings": {
    pattern: "length-prefix encoding",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the length-prefix encoding approach for strings problems." },
      { level: 2, text: "Can you solve Encode and Decode Strings in O(n log n) or better? Consider how length-prefix encoding helps." },
      { level: 3, text: "The optimal solution uses length-prefix encoding. Work through small examples to see the pattern." },
    ],
  },

  "linked-list-cycle": {
    pattern: "slow and fast pointers",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the slow and fast pointers approach for linked list problems." },
      { level: 2, text: "Can you solve Linked List Cycle in O(n log n) or better? Consider how slow and fast pointers helps." },
      { level: 3, text: "The optimal solution uses slow and fast pointers. Work through small examples to see the pattern." },
    ],
  },

  "reorder-list": {
    pattern: "slow-fast + reverse + merge",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the slow-fast + reverse + merge approach for linked list problems." },
      { level: 2, text: "Can you solve Reorder List in O(n log n) or better? Consider how slow-fast + reverse + merge helps." },
      { level: 3, text: "The optimal solution uses slow-fast + reverse + merge. Work through small examples to see the pattern." },
    ],
  },

  "lru-cache": {
    pattern: "doubly linked list + hashmap",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the doubly linked list + hashmap approach for linked list problems." },
      { level: 2, text: "Can you solve LRU Cache in O(n log n) or better? Consider how doubly linked list + hashmap helps." },
      { level: 3, text: "The optimal solution uses doubly linked list + hashmap. Work through small examples to see the pattern." },
    ],
  },

  "intersection-of-two-linked-lists": {
    pattern: "two pointers length equalization",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two pointers length equalization approach for linked list problems." },
      { level: 2, text: "Can you solve Intersection of Two Linked Lists in O(n log n) or better? Consider how two pointers length equalization helps." },
      { level: 3, text: "The optimal solution uses two pointers length equalization. Work through small examples to see the pattern." },
    ],
  },

  "palindrome-linked-list": {
    pattern: "slow-fast + reverse second half",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the slow-fast + reverse second half approach for linked list problems." },
      { level: 2, text: "Can you solve Palindrome Linked List in O(n log n) or better? Consider how slow-fast + reverse second half helps." },
      { level: 3, text: "The optimal solution uses slow-fast + reverse second half. Work through small examples to see the pattern." },
    ],
  },

  "binary-tree-level-order-traversal": {
    pattern: "BFS queue",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BFS queue approach for trees problems." },
      { level: 2, text: "Can you solve Binary Tree Level Order Traversal in O(n log n) or better? Consider how BFS queue helps." },
      { level: 3, text: "The optimal solution uses BFS queue. Work through small examples to see the pattern." },
    ],
  },

  "lowest-common-ancestor-of-bst": {
    pattern: "BST property traversal",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BST property traversal approach for trees problems." },
      { level: 2, text: "Can you solve Lowest Common Ancestor of BST in O(n log n) or better? Consider how BST property traversal helps." },
      { level: 3, text: "The optimal solution uses BST property traversal. Work through small examples to see the pattern." },
    ],
  },

  "construct-binary-tree-from-preorder-inorder": {
    pattern: "divide and conquer recursion",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the divide and conquer recursion approach for trees problems." },
      { level: 2, text: "Can you solve Construct Binary Tree from Preorder and Inorder Traversal in O(n log n) or better? Consider how divide and conquer recursion helps." },
      { level: 3, text: "The optimal solution uses divide and conquer recursion. Work through small examples to see the pattern." },
    ],
  },

  "serialize-deserialize-binary-tree": {
    pattern: "BFS serialization",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BFS serialization approach for trees problems." },
      { level: 2, text: "Can you solve Serialize and Deserialize Binary Tree in O(n log n) or better? Consider how BFS serialization helps." },
      { level: 3, text: "The optimal solution uses BFS serialization. Work through small examples to see the pattern." },
    ],
  },

  "binary-tree-right-side-view": {
    pattern: "BFS level order rightmost",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BFS level order rightmost approach for trees problems." },
      { level: 2, text: "Can you solve Binary Tree Right Side View in O(n log n) or better? Consider how BFS level order rightmost helps." },
      { level: 3, text: "The optimal solution uses BFS level order rightmost. Work through small examples to see the pattern." },
    ],
  },

  "clone-graph": {
    pattern: "BFS/DFS with hash map",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BFS/DFS with hash map approach for graphs problems." },
      { level: 2, text: "Can you solve Clone Graph in O(n log n) or better? Consider how BFS/DFS with hash map helps." },
      { level: 3, text: "The optimal solution uses BFS/DFS with hash map. Work through small examples to see the pattern." },
    ],
  },

  "course-schedule": {
    pattern: "topological sort / cycle detection",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the topological sort / cycle detection approach for graphs problems." },
      { level: 2, text: "Can you solve Course Schedule in O(n log n) or better? Consider how topological sort / cycle detection helps." },
      { level: 3, text: "The optimal solution uses topological sort / cycle detection. Work through small examples to see the pattern." },
    ],
  },

  "pacific-atlantic-water-flow": {
    pattern: "multi-source BFS",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the multi-source BFS approach for graphs problems." },
      { level: 2, text: "Can you solve Pacific Atlantic Water Flow in O(n log n) or better? Consider how multi-source BFS helps." },
      { level: 3, text: "The optimal solution uses multi-source BFS. Work through small examples to see the pattern." },
    ],
  },

  "rotting-oranges": {
    pattern: "multi-source BFS",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the multi-source BFS approach for graphs problems." },
      { level: 2, text: "Can you solve Rotting Oranges in O(n log n) or better? Consider how multi-source BFS helps." },
      { level: 3, text: "The optimal solution uses multi-source BFS. Work through small examples to see the pattern." },
    ],
  },

  "word-ladder": {
    pattern: "BFS shortest path",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BFS shortest path approach for graphs problems." },
      { level: 2, text: "Can you solve Word Ladder in O(n log n) or better? Consider how BFS shortest path helps." },
      { level: 3, text: "The optimal solution uses BFS shortest path. Work through small examples to see the pattern." },
    ],
  },

  "unique-paths": {
    pattern: "2D DP grid",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP grid approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Unique Paths in O(n log n) or better? Consider how 2D DP grid helps." },
      { level: 3, text: "The optimal solution uses 2D DP grid. Work through small examples to see the pattern." },
    ],
  },

  "longest-increasing-subsequence": {
    pattern: "patience sorting / binary search DP",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the patience sorting / binary search DP approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Longest Increasing Subsequence in O(n log n) or better? Consider how patience sorting / binary search DP helps." },
      { level: 3, text: "The optimal solution uses patience sorting / binary search DP. Work through small examples to see the pattern." },
    ],
  },

  "edit-distance": {
    pattern: "2D DP string",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP string approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Edit Distance in O(n log n) or better? Consider how 2D DP string helps." },
      { level: 3, text: "The optimal solution uses 2D DP string. Work through small examples to see the pattern." },
    ],
  },

  "partition-equal-subset-sum": {
    pattern: "0/1 knapsack",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 0/1 knapsack approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Partition Equal Subset Sum in O(n log n) or better? Consider how 0/1 knapsack helps." },
      { level: 3, text: "The optimal solution uses 0/1 knapsack. Work through small examples to see the pattern." },
    ],
  },

  "burst-balloons": {
    pattern: "interval DP",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the interval DP approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Burst Balloons in O(n log n) or better? Consider how interval DP helps." },
      { level: 3, text: "The optimal solution uses interval DP. Work through small examples to see the pattern." },
    ],
  },

  "top-k-frequent-elements": {
    pattern: "bucket sort / heap",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bucket sort / heap approach for heap problems." },
      { level: 2, text: "Can you solve Top K Frequent Elements in O(n log n) or better? Consider how bucket sort / heap helps." },
      { level: 3, text: "The optimal solution uses bucket sort / heap. Work through small examples to see the pattern." },
    ],
  },

  "find-median-from-data-stream": {
    pattern: "two heaps (max-heap + min-heap)",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two heaps (max-heap + min-heap) approach for heap problems." },
      { level: 2, text: "Can you solve Find Median from Data Stream in O(n log n) or better? Consider how two heaps (max-heap + min-heap) helps." },
      { level: 3, text: "The optimal solution uses two heaps (max-heap + min-heap). Work through small examples to see the pattern." },
    ],
  },

  "k-closest-points-to-origin": {
    pattern: "max-heap of size k",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the max-heap of size k approach for heap problems." },
      { level: 2, text: "Can you solve K Closest Points to Origin in O(n log n) or better? Consider how max-heap of size k helps." },
      { level: 3, text: "The optimal solution uses max-heap of size k. Work through small examples to see the pattern." },
    ],
  },

  "task-scheduler": {
    pattern: "greedy with max-heap",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the greedy with max-heap approach for heap problems." },
      { level: 2, text: "Can you solve Task Scheduler in O(n log n) or better? Consider how greedy with max-heap helps." },
      { level: 3, text: "The optimal solution uses greedy with max-heap. Work through small examples to see the pattern." },
    ],
  },

  "merge-k-sorted-lists": {
    pattern: "min-heap / divide and conquer",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the min-heap / divide and conquer approach for heap problems." },
      { level: 2, text: "Can you solve Merge K Sorted Lists in O(n log n) or better? Consider how min-heap / divide and conquer helps." },
      { level: 3, text: "The optimal solution uses min-heap / divide and conquer. Work through small examples to see the pattern." },
    ],
  },

  "search-a-2d-matrix": {
    pattern: "treat matrix as sorted array",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the treat matrix as sorted array approach for binary search problems." },
      { level: 2, text: "Can you solve Search a 2D Matrix in O(n log n) or better? Consider how treat matrix as sorted array helps." },
      { level: 3, text: "The optimal solution uses treat matrix as sorted array. Work through small examples to see the pattern." },
    ],
  },

  "koko-eating-bananas": {
    pattern: "binary search on answer",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on answer approach for binary search problems." },
      { level: 2, text: "Can you solve Koko Eating Bananas in O(n log n) or better? Consider how binary search on answer helps." },
      { level: 3, text: "The optimal solution uses binary search on answer. Work through small examples to see the pattern." },
    ],
  },

  "time-based-key-value-store": {
    pattern: "binary search on sorted timestamps",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on sorted timestamps approach for binary search problems." },
      { level: 2, text: "Can you solve Time Based Key-Value Store in O(n log n) or better? Consider how binary search on sorted timestamps helps." },
      { level: 3, text: "The optimal solution uses binary search on sorted timestamps. Work through small examples to see the pattern." },
    ],
  },

  "median-of-two-sorted-arrays": {
    pattern: "binary search on partition",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on partition approach for binary search problems." },
      { level: 2, text: "Can you solve Median of Two Sorted Arrays in O(n log n) or better? Consider how binary search on partition helps." },
      { level: 3, text: "The optimal solution uses binary search on partition. Work through small examples to see the pattern." },
    ],
  },

  "find-peak-element": {
    pattern: "binary search on peak condition",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on peak condition approach for binary search problems." },
      { level: 2, text: "Can you solve Find Peak Element in O(n log n) or better? Consider how binary search on peak condition helps." },
      { level: 3, text: "The optimal solution uses binary search on peak condition. Work through small examples to see the pattern." },
    ],
  },

  "permutations": {
    pattern: "swap-based backtracking",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the swap-based backtracking approach for backtracking problems." },
      { level: 2, text: "Can you solve Permutations in O(n log n) or better? Consider how swap-based backtracking helps." },
      { level: 3, text: "The optimal solution uses swap-based backtracking. Work through small examples to see the pattern." },
    ],
  },

  "sudoku-solver": {
    pattern: "constraint backtracking",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the constraint backtracking approach for backtracking problems." },
      { level: 2, text: "Can you solve Sudoku Solver in O(n log n) or better? Consider how constraint backtracking helps." },
      { level: 3, text: "The optimal solution uses constraint backtracking. Work through small examples to see the pattern." },
    ],
  },

  "generate-parentheses": {
    pattern: "DFS with open/close counters",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS with open/close counters approach for backtracking problems." },
      { level: 2, text: "Can you solve Generate Parentheses in O(n log n) or better? Consider how DFS with open/close counters helps." },
      { level: 3, text: "The optimal solution uses DFS with open/close counters. Work through small examples to see the pattern." },
    ],
  },

  "word-search": {
    pattern: "DFS grid backtracking",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS grid backtracking approach for backtracking problems." },
      { level: 2, text: "Can you solve Word Search in O(n log n) or better? Consider how DFS grid backtracking helps." },
      { level: 3, text: "The optimal solution uses DFS grid backtracking. Work through small examples to see the pattern." },
    ],
  },

  "n-queens": {
    pattern: "row-by-row constraint backtracking",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the row-by-row constraint backtracking approach for backtracking problems." },
      { level: 2, text: "Can you solve N-Queens in O(n log n) or better? Consider how row-by-row constraint backtracking helps." },
      { level: 3, text: "The optimal solution uses row-by-row constraint backtracking. Work through small examples to see the pattern." },
    ],
  },

  "implement-trie": {
    pattern: "trie insert/search/prefix",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the trie insert/search/prefix approach for trie problems." },
      { level: 2, text: "Can you solve Implement Trie (Prefix Tree) in O(n log n) or better? Consider how trie insert/search/prefix helps." },
      { level: 3, text: "The optimal solution uses trie insert/search/prefix. Work through small examples to see the pattern." },
    ],
  },

  "word-search-ii": {
    pattern: "trie + DFS grid",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the trie + DFS grid approach for trie problems." },
      { level: 2, text: "Can you solve Word Search II in O(n log n) or better? Consider how trie + DFS grid helps." },
      { level: 3, text: "The optimal solution uses trie + DFS grid. Work through small examples to see the pattern." },
    ],
  },

  "design-add-search-words": {
    pattern: "trie with wildcard DFS",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the trie with wildcard DFS approach for trie problems." },
      { level: 2, text: "Can you solve Design Add and Search Words Data Structure in O(n log n) or better? Consider how trie with wildcard DFS helps." },
      { level: 3, text: "The optimal solution uses trie with wildcard DFS. Work through small examples to see the pattern." },
    ],
  },

  "maximum-xor-of-two-numbers": {
    pattern: "bit trie",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bit trie approach for trie problems." },
      { level: 2, text: "Can you solve Maximum XOR of Two Numbers in an Array in O(n log n) or better? Consider how bit trie helps." },
      { level: 3, text: "The optimal solution uses bit trie. Work through small examples to see the pattern." },
    ],
  },

  "replace-words": {
    pattern: "trie prefix lookup",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the trie prefix lookup approach for trie problems." },
      { level: 2, text: "Can you solve Replace Words in O(n log n) or better? Consider how trie prefix lookup helps." },
      { level: 3, text: "The optimal solution uses trie prefix lookup. Work through small examples to see the pattern." },
    ],
  },

  "four-sum": {
    pattern: "sort + two nested loops + two pointers",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + two nested loops + two pointers approach for two pointers problems." },
      { level: 2, text: "Can you solve 4Sum in O(n log n) or better? Consider how sort + two nested loops + two pointers helps." },
      { level: 3, text: "The optimal solution uses sort + two nested loops + two pointers. Work through small examples to see the pattern." },
    ],
  },

  "longest-repeating-character-replacement": {
    pattern: "sliding window with max frequency",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sliding window with max frequency approach for sliding window problems." },
      { level: 2, text: "Can you solve Longest Repeating Character Replacement in O(n log n) or better? Consider how sliding window with max frequency helps." },
      { level: 3, text: "The optimal solution uses sliding window with max frequency. Work through small examples to see the pattern." },
    ],
  },

  "permutation-in-string": {
    pattern: "fixed-window frequency match",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the fixed-window frequency match approach for sliding window problems." },
      { level: 2, text: "Can you solve Permutation in String in O(n log n) or better? Consider how fixed-window frequency match helps." },
      { level: 3, text: "The optimal solution uses fixed-window frequency match. Work through small examples to see the pattern." },
    ],
  },

  "fruit-into-baskets": {
    pattern: "at most k distinct elements window",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the at most k distinct elements window approach for sliding window problems." },
      { level: 2, text: "Can you solve Fruit Into Baskets in O(n log n) or better? Consider how at most k distinct elements window helps." },
      { level: 3, text: "The optimal solution uses at most k distinct elements window. Work through small examples to see the pattern." },
    ],
  },

  "subarray-sum-equals-k": {
    pattern: "prefix sum + hash map",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the prefix sum + hash map approach for hash maps problems." },
      { level: 2, text: "Can you solve Subarray Sum Equals K in O(n log n) or better? Consider how prefix sum + hash map helps." },
      { level: 3, text: "The optimal solution uses prefix sum + hash map. Work through small examples to see the pattern." },
    ],
  },

  "jump-game": {
    pattern: "greedy max reach",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the greedy max reach approach for greedy problems." },
      { level: 2, text: "Can you solve Jump Game in O(n log n) or better? Consider how greedy max reach helps." },
      { level: 3, text: "The optimal solution uses greedy max reach. Work through small examples to see the pattern." },
    ],
  },

  "gas-station": {
    pattern: "total tank check + start tracking",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the total tank check + start tracking approach for greedy problems." },
      { level: 2, text: "Can you solve Gas Station in O(n log n) or better? Consider how total tank check + start tracking helps." },
      { level: 3, text: "The optimal solution uses total tank check + start tracking. Work through small examples to see the pattern." },
    ],
  },

  "hand-of-straights": {
    pattern: "sorted frequency map",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sorted frequency map approach for greedy problems." },
      { level: 2, text: "Can you solve Hand of Straights in O(n log n) or better? Consider how sorted frequency map helps." },
      { level: 3, text: "The optimal solution uses sorted frequency map. Work through small examples to see the pattern." },
    ],
  },

  "merge-intervals": {
    pattern: "sort + linear merge",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + linear merge approach for greedy problems." },
      { level: 2, text: "Can you solve Merge Intervals in O(n log n) or better? Consider how sort + linear merge helps." },
      { level: 3, text: "The optimal solution uses sort + linear merge. Work through small examples to see the pattern." },
    ],
  },

  "non-overlapping-intervals": {
    pattern: "sort by end time + greedy keep",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort by end time + greedy keep approach for greedy problems." },
      { level: 2, text: "Can you solve Non-overlapping Intervals in O(n log n) or better? Consider how sort by end time + greedy keep helps." },
      { level: 3, text: "The optimal solution uses sort by end time + greedy keep. Work through small examples to see the pattern." },
    ],
  },

  "counting-bits": {
    pattern: "DP with bit shift",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DP with bit shift approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Counting Bits in O(n log n) or better? Consider how DP with bit shift helps." },
      { level: 3, text: "The optimal solution uses DP with bit shift. Work through small examples to see the pattern." },
    ],
  },

  "reverse-bits": {
    pattern: "bit shift and mask",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bit shift and mask approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Reverse Bits in O(n log n) or better? Consider how bit shift and mask helps." },
      { level: 3, text: "The optimal solution uses bit shift and mask. Work through small examples to see the pattern." },
    ],
  },

  "missing-number": {
    pattern: "XOR / Gauss sum",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the XOR / Gauss sum approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Missing Number in O(n log n) or better? Consider how XOR / Gauss sum helps." },
      { level: 3, text: "The optimal solution uses XOR / Gauss sum. Work through small examples to see the pattern." },
    ],
  },

  "number-of-1-bits": {
    pattern: "n & (n-1) trick",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the n & (n-1) trick approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Number of 1 Bits in O(n log n) or better? Consider how n & (n-1) trick helps." },
      { level: 3, text: "The optimal solution uses n & (n-1) trick. Work through small examples to see the pattern." },
    ],
  },

  "sum-of-two-integers": {
    pattern: "bit manipulation add without +",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bit manipulation add without + approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Sum of Two Integers in O(n log n) or better? Consider how bit manipulation add without + helps." },
      { level: 3, text: "The optimal solution uses bit manipulation add without +. Work through small examples to see the pattern." },
    ],
  },

  "maximum-product-subarray": {
    pattern: "track min and max simultaneously",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the track min and max simultaneously approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Maximum Product Subarray in O(n log n) or better? Consider how track min and max simultaneously helps." },
      { level: 3, text: "The optimal solution uses track min and max simultaneously. Work through small examples to see the pattern." },
    ],
  },

  "longest-common-subsequence": {
    pattern: "2D DP string",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP string approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Longest Common Subsequence in O(n log n) or better? Consider how 2D DP string helps." },
      { level: 3, text: "The optimal solution uses 2D DP string. Work through small examples to see the pattern." },
    ],
  },

  "palindrome-partitioning": {
    pattern: "backtracking + palindrome check",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the backtracking + palindrome check approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Palindrome Partitioning in O(n log n) or better? Consider how backtracking + palindrome check helps." },
      { level: 3, text: "The optimal solution uses backtracking + palindrome check. Work through small examples to see the pattern." },
    ],
  },

  "house-robber-ii": {
    pattern: "circular DP — run twice",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the circular DP — run twice approach for dynamic programming problems." },
      { level: 2, text: "Can you solve House Robber II in O(n log n) or better? Consider how circular DP — run twice helps." },
      { level: 3, text: "The optimal solution uses circular DP — run twice. Work through small examples to see the pattern." },
    ],
  },

  "regular-expression-matching": {
    pattern: "2D DP with * handling",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP with * handling approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Regular Expression Matching in O(n log n) or better? Consider how 2D DP with * handling helps." },
      { level: 3, text: "The optimal solution uses 2D DP with * handling. Work through small examples to see the pattern." },
    ],
  },

  "largest-rectangle-in-histogram": {
    pattern: "monotonic stack",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the monotonic stack approach for stacks problems." },
      { level: 2, text: "Can you solve Largest Rectangle in Histogram in O(n log n) or better? Consider how monotonic stack helps." },
      { level: 3, text: "The optimal solution uses monotonic stack. Work through small examples to see the pattern." },
    ],
  },

  "car-fleet": {
    pattern: "sort + monotonic stack",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + monotonic stack approach for stacks problems." },
      { level: 2, text: "Can you solve Car Fleet in O(n log n) or better? Consider how sort + monotonic stack helps." },
      { level: 3, text: "The optimal solution uses sort + monotonic stack. Work through small examples to see the pattern." },
    ],
  },

  "evaluate-reverse-polish-notation": {
    pattern: "stack evaluation",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the stack evaluation approach for stacks problems." },
      { level: 2, text: "Can you solve Evaluate Reverse Polish Notation in O(n log n) or better? Consider how stack evaluation helps." },
      { level: 3, text: "The optimal solution uses stack evaluation. Work through small examples to see the pattern." },
    ],
  },

  "basic-calculator-ii": {
    pattern: "stack with operator precedence",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the stack with operator precedence approach for stacks problems." },
      { level: 2, text: "Can you solve Basic Calculator II in O(n log n) or better? Consider how stack with operator precedence helps." },
      { level: 3, text: "The optimal solution uses stack with operator precedence. Work through small examples to see the pattern." },
    ],
  },

  "implement-queue-using-stacks": {
    pattern: "two stacks",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two stacks approach for stacks problems." },
      { level: 2, text: "Can you solve Implement Queue using Stacks in O(n log n) or better? Consider how two stacks helps." },
      { level: 3, text: "The optimal solution uses two stacks. Work through small examples to see the pattern." },
    ],
  },

  "network-delay-time": {
    pattern: "Dijkstra's algorithm",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Dijkstra's algorithm approach for graphs problems." },
      { level: 2, text: "Can you solve Network Delay Time in O(n log n) or better? Consider how Dijkstra's algorithm helps." },
      { level: 3, text: "The optimal solution uses Dijkstra's algorithm. Work through small examples to see the pattern." },
    ],
  },

  "cheapest-flights-within-k-stops": {
    pattern: "Bellman-Ford / BFS with limit",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Bellman-Ford / BFS with limit approach for graphs problems." },
      { level: 2, text: "Can you solve Cheapest Flights Within K Stops in O(n log n) or better? Consider how Bellman-Ford / BFS with limit helps." },
      { level: 3, text: "The optimal solution uses Bellman-Ford / BFS with limit. Work through small examples to see the pattern." },
    ],
  },

  "min-cost-to-connect-all-points": {
    pattern: "Prim's MST / Kruskal's",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Prim's MST / Kruskal's approach for graphs problems." },
      { level: 2, text: "Can you solve Min Cost to Connect All Points in O(n log n) or better? Consider how Prim's MST / Kruskal's helps." },
      { level: 3, text: "The optimal solution uses Prim's MST / Kruskal's. Work through small examples to see the pattern." },
    ],
  },

  "number-of-connected-components": {
    pattern: "Union-Find / DFS",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Union-Find / DFS approach for graphs problems." },
      { level: 2, text: "Can you solve Number of Connected Components in Undirected Graph in O(n log n) or better? Consider how Union-Find / DFS helps." },
      { level: 3, text: "The optimal solution uses Union-Find / DFS. Work through small examples to see the pattern." },
    ],
  },

  "redundant-connection": {
    pattern: "Union-Find cycle detection",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Union-Find cycle detection approach for graphs problems." },
      { level: 2, text: "Can you solve Redundant Connection in O(n log n) or better? Consider how Union-Find cycle detection helps." },
      { level: 3, text: "The optimal solution uses Union-Find cycle detection. Work through small examples to see the pattern." },
    ],
  },

  "merge-intervals": {
    pattern: "sort + merge",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + merge approach for intervals problems." },
      { level: 2, text: "Can you solve Merge Intervals in O(n log n) or better? Consider how sort + merge helps." },
      { level: 3, text: "The optimal solution uses sort + merge. Work through small examples to see the pattern." },
    ],
  },

  "insert-interval": {
    pattern: "linear scan merge",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the linear scan merge approach for intervals problems." },
      { level: 2, text: "Can you solve Insert Interval in O(n log n) or better? Consider how linear scan merge helps." },
      { level: 3, text: "The optimal solution uses linear scan merge. Work through small examples to see the pattern." },
    ],
  },

  "non-overlapping-intervals": {
    pattern: "greedy interval scheduling",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the greedy interval scheduling approach for intervals problems." },
      { level: 2, text: "Can you solve Non-overlapping Intervals in O(n log n) or better? Consider how greedy interval scheduling helps." },
      { level: 3, text: "The optimal solution uses greedy interval scheduling. Work through small examples to see the pattern." },
    ],
  },

  "meeting-rooms": {
    pattern: "sort and check overlap",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort and check overlap approach for intervals problems." },
      { level: 2, text: "Can you solve Meeting Rooms in O(n log n) or better? Consider how sort and check overlap helps." },
      { level: 3, text: "The optimal solution uses sort and check overlap. Work through small examples to see the pattern." },
    ],
  },

  "meeting-rooms-ii": {
    pattern: "min heap / sweep line",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the min heap / sweep line approach for intervals problems." },
      { level: 2, text: "Can you solve Meeting Rooms II in O(n log n) or better? Consider how min heap / sweep line helps." },
      { level: 3, text: "The optimal solution uses min heap / sweep line. Work through small examples to see the pattern." },
    ],
  },

  "set-matrix-zeroes": {
    pattern: "in-place marker",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the in-place marker approach for matrix problems." },
      { level: 2, text: "Can you solve Set Matrix Zeroes in O(n log n) or better? Consider how in-place marker helps." },
      { level: 3, text: "The optimal solution uses in-place marker. Work through small examples to see the pattern." },
    ],
  },

  "spiral-matrix": {
    pattern: "layer-by-layer simulation",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the layer-by-layer simulation approach for matrix problems." },
      { level: 2, text: "Can you solve Spiral Matrix in O(n log n) or better? Consider how layer-by-layer simulation helps." },
      { level: 3, text: "The optimal solution uses layer-by-layer simulation. Work through small examples to see the pattern." },
    ],
  },

  "rotate-image": {
    pattern: "transpose + reverse",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the transpose + reverse approach for matrix problems." },
      { level: 2, text: "Can you solve Rotate Image in O(n log n) or better? Consider how transpose + reverse helps." },
      { level: 3, text: "The optimal solution uses transpose + reverse. Work through small examples to see the pattern." },
    ],
  },

  "search-a-2d-matrix": {
    pattern: "binary search on flattened matrix",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on flattened matrix approach for matrix problems." },
      { level: 2, text: "Can you solve Search a 2D Matrix in O(n log n) or better? Consider how binary search on flattened matrix helps." },
      { level: 3, text: "The optimal solution uses binary search on flattened matrix. Work through small examples to see the pattern." },
    ],
  },

  "game-of-life": {
    pattern: "in-place state encoding",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the in-place state encoding approach for matrix problems." },
      { level: 2, text: "Can you solve Game of Life in O(n log n) or better? Consider how in-place state encoding helps." },
      { level: 3, text: "The optimal solution uses in-place state encoding. Work through small examples to see the pattern." },
    ],
  },

  "reverse-integer": {
    pattern: "digit extraction",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the digit extraction approach for math problems." },
      { level: 2, text: "Can you solve Reverse Integer in O(n log n) or better? Consider how digit extraction helps." },
      { level: 3, text: "The optimal solution uses digit extraction. Work through small examples to see the pattern." },
    ],
  },

  "palindrome-number": {
    pattern: "digit reversal",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the digit reversal approach for math problems." },
      { level: 2, text: "Can you solve Palindrome Number in O(n log n) or better? Consider how digit reversal helps." },
      { level: 3, text: "The optimal solution uses digit reversal. Work through small examples to see the pattern." },
    ],
  },

  "happy-number": {
    pattern: "cycle detection Floyd",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the cycle detection Floyd approach for math problems." },
      { level: 2, text: "Can you solve Happy Number in O(n log n) or better? Consider how cycle detection Floyd helps." },
      { level: 3, text: "The optimal solution uses cycle detection Floyd. Work through small examples to see the pattern." },
    ],
  },

  "power-of-two": {
    pattern: "bit manipulation",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bit manipulation approach for math problems." },
      { level: 2, text: "Can you solve Power of Two in O(n log n) or better? Consider how bit manipulation helps." },
      { level: 3, text: "The optimal solution uses bit manipulation. Work through small examples to see the pattern." },
    ],
  },

  "excel-sheet-column-number": {
    pattern: "base-26 conversion",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the base-26 conversion approach for math problems." },
      { level: 2, text: "Can you solve Excel Sheet Column Number in O(n log n) or better? Consider how base-26 conversion helps." },
      { level: 3, text: "The optimal solution uses base-26 conversion. Work through small examples to see the pattern." },
    ],
  },

  "count-primes": {
    pattern: "Sieve of Eratosthenes",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Sieve of Eratosthenes approach for math problems." },
      { level: 2, text: "Can you solve Count Primes in O(n log n) or better? Consider how Sieve of Eratosthenes helps." },
      { level: 3, text: "The optimal solution uses Sieve of Eratosthenes. Work through small examples to see the pattern." },
    ],
  },

  "sqrt-x": {
    pattern: "binary search",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search approach for math problems." },
      { level: 2, text: "Can you solve Sqrt(x) in O(n log n) or better? Consider how binary search helps." },
      { level: 3, text: "The optimal solution uses binary search. Work through small examples to see the pattern." },
    ],
  },

  "roman-to-integer": {
    pattern: "symbol table lookup",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the symbol table lookup approach for math problems." },
      { level: 2, text: "Can you solve Roman to Integer in O(n log n) or better? Consider how symbol table lookup helps." },
      { level: 3, text: "The optimal solution uses symbol table lookup. Work through small examples to see the pattern." },
    ],
  },

  "add-two-numbers": {
    pattern: "carry propagation",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the carry propagation approach for linked list problems." },
      { level: 2, text: "Can you solve Add Two Numbers in O(n log n) or better? Consider how carry propagation helps." },
      { level: 3, text: "The optimal solution uses carry propagation. Work through small examples to see the pattern." },
    ],
  },

  "pow-x-n": {
    pattern: "fast exponentiation",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the fast exponentiation approach for math problems." },
      { level: 2, text: "Can you solve Pow(x, n) in O(n log n) or better? Consider how fast exponentiation helps." },
      { level: 3, text: "The optimal solution uses fast exponentiation. Work through small examples to see the pattern." },
    ],
  },

  "4sum": {
    pattern: "sort + two pointer extension",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + two pointer extension approach for two pointers problems." },
      { level: 2, text: "Can you solve 4Sum in O(n log n) or better? Consider how sort + two pointer extension helps." },
      { level: 3, text: "The optimal solution uses sort + two pointer extension. Work through small examples to see the pattern." },
    ],
  },

  "remove-duplicates-sorted-array-ii": {
    pattern: "slow-fast pointer",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the slow-fast pointer approach for two pointers problems." },
      { level: 2, text: "Can you solve Remove Duplicates from Sorted Array II in O(n log n) or better? Consider how slow-fast pointer helps." },
      { level: 3, text: "The optimal solution uses slow-fast pointer. Work through small examples to see the pattern." },
    ],
  },

  "valid-triangle-number": {
    pattern: "sort + two pointer",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + two pointer approach for two pointers problems." },
      { level: 2, text: "Can you solve Valid Triangle Number in O(n log n) or better? Consider how sort + two pointer helps." },
      { level: 3, text: "The optimal solution uses sort + two pointer. Work through small examples to see the pattern." },
    ],
  },

  "implement-stack-using-queues": {
    pattern: "queue rotation trick",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the queue rotation trick approach for design problems." },
      { level: 2, text: "Can you solve Implement Stack using Queues in O(n log n) or better? Consider how queue rotation trick helps." },
      { level: 3, text: "The optimal solution uses queue rotation trick. Work through small examples to see the pattern." },
    ],
  },

  "design-hashmap": {
    pattern: "chaining / open addressing",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the chaining / open addressing approach for design problems." },
      { level: 2, text: "Can you solve Design HashMap in O(n log n) or better? Consider how chaining / open addressing helps." },
      { level: 3, text: "The optimal solution uses chaining / open addressing. Work through small examples to see the pattern." },
    ],
  },

  "design-circular-queue": {
    pattern: "ring buffer",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the ring buffer approach for design problems." },
      { level: 2, text: "Can you solve Design Circular Queue in O(n log n) or better? Consider how ring buffer helps." },
      { level: 3, text: "The optimal solution uses ring buffer. Work through small examples to see the pattern." },
    ],
  },

  "find-median-from-data-stream": {
    pattern: "two heaps",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two heaps approach for design problems." },
      { level: 2, text: "Can you solve Find Median from Data Stream in O(n log n) or better? Consider how two heaps helps." },
      { level: 3, text: "The optimal solution uses two heaps. Work through small examples to see the pattern." },
    ],
  },

  "time-based-key-value-store": {
    pattern: "binary search on timestamps",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on timestamps approach for design problems." },
      { level: 2, text: "Can you solve Time Based Key-Value Store in O(n log n) or better? Consider how binary search on timestamps helps." },
      { level: 3, text: "The optimal solution uses binary search on timestamps. Work through small examples to see the pattern." },
    ],
  },

  "maximum-frequency-stack": {
    pattern: "frequency groups stack",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the frequency groups stack approach for design problems." },
      { level: 2, text: "Can you solve Maximum Frequency Stack in O(n log n) or better? Consider how frequency groups stack helps." },
      { level: 3, text: "The optimal solution uses frequency groups stack. Work through small examples to see the pattern." },
    ],
  },

  "sliding-window-maximum": {
    pattern: "monotonic deque",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the monotonic deque approach for sliding window problems." },
      { level: 2, text: "Can you solve Sliding Window Maximum in O(n log n) or better? Consider how monotonic deque helps." },
      { level: 3, text: "The optimal solution uses monotonic deque. Work through small examples to see the pattern." },
    ],
  },

  "merge-k-sorted-lists": {
    pattern: "min heap merge",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the min heap merge approach for heap problems." },
      { level: 2, text: "Can you solve Merge K Sorted Lists in O(n log n) or better? Consider how min heap merge helps." },
      { level: 3, text: "The optimal solution uses min heap merge. Work through small examples to see the pattern." },
    ],
  },

  "reverse-nodes-in-k-group": {
    pattern: "iterative group reversal",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the iterative group reversal approach for linked list problems." },
      { level: 2, text: "Can you solve Reverse Nodes in k-Group in O(n log n) or better? Consider how iterative group reversal helps." },
      { level: 3, text: "The optimal solution uses iterative group reversal. Work through small examples to see the pattern." },
    ],
  },

  "longest-valid-parentheses": {
    pattern: "stack index tracking",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the stack index tracking approach for stacks problems." },
      { level: 2, text: "Can you solve Longest Valid Parentheses in O(n log n) or better? Consider how stack index tracking helps." },
      { level: 3, text: "The optimal solution uses stack index tracking. Work through small examples to see the pattern." },
    ],
  },

  "jump-game": {
    pattern: "max reach greedy",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the max reach greedy approach for greedy problems." },
      { level: 2, text: "Can you solve Jump Game in O(n log n) or better? Consider how max reach greedy helps." },
      { level: 3, text: "The optimal solution uses max reach greedy. Work through small examples to see the pattern." },
    ],
  },

  "gas-station": {
    pattern: "running sum reset",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the running sum reset approach for greedy problems." },
      { level: 2, text: "Can you solve Gas Station in O(n log n) or better? Consider how running sum reset helps." },
      { level: 3, text: "The optimal solution uses running sum reset. Work through small examples to see the pattern." },
    ],
  },

  "task-scheduler": {
    pattern: "frequency + cooldown math",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the frequency + cooldown math approach for greedy problems." },
      { level: 2, text: "Can you solve Task Scheduler in O(n log n) or better? Consider how frequency + cooldown math helps." },
      { level: 3, text: "The optimal solution uses frequency + cooldown math. Work through small examples to see the pattern." },
    ],
  },

  "kth-smallest-element-in-bst": {
    pattern: "inorder traversal",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the inorder traversal approach for trees problems." },
      { level: 2, text: "Can you solve Kth Smallest Element in BST in O(n log n) or better? Consider how inorder traversal helps." },
      { level: 3, text: "The optimal solution uses inorder traversal. Work through small examples to see the pattern." },
    ],
  },

  "path-sum-ii": {
    pattern: "DFS backtracking",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS backtracking approach for trees problems." },
      { level: 2, text: "Can you solve Path Sum II in O(n log n) or better? Consider how DFS backtracking helps." },
      { level: 3, text: "The optimal solution uses DFS backtracking. Work through small examples to see the pattern." },
    ],
  },

  "maximum-width-of-binary-tree": {
    pattern: "BFS with index tracking",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BFS with index tracking approach for trees problems." },
      { level: 2, text: "Can you solve Maximum Width of Binary Tree in O(n log n) or better? Consider how BFS with index tracking helps." },
      { level: 3, text: "The optimal solution uses BFS with index tracking. Work through small examples to see the pattern." },
    ],
  },

  "number-of-ways-k-steps": {
    pattern: "1D DP offset array",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 1D DP offset array approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Number of Ways to Reach a Position After Exactly k Steps in O(n log n) or better? Consider how 1D DP offset array helps." },
      { level: 3, text: "The optimal solution uses 1D DP offset array. Work through small examples to see the pattern." },
    ],
  },

  "longest-common-subsequence": {
    pattern: "2D DP string",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP string approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Longest Common Subsequence in O(n log n) or better? Consider how 2D DP string helps." },
      { level: 3, text: "The optimal solution uses 2D DP string. Work through small examples to see the pattern." },
    ],
  },

  "maximum-product-subarray": {
    pattern: "track min and max simultaneously",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the track min and max simultaneously approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Maximum Product Subarray in O(n log n) or better? Consider how track min and max simultaneously helps." },
      { level: 3, text: "The optimal solution uses track min and max simultaneously. Work through small examples to see the pattern." },
    ],
  },

  "min-cost-climbing-stairs": {
    pattern: "1D DP",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 1D DP approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Min Cost Climbing Stairs in O(n log n) or better? Consider how 1D DP helps." },
      { level: 3, text: "The optimal solution uses 1D DP. Work through small examples to see the pattern." },
    ],
  },

  "triangle": {
    pattern: "bottom-up DP",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bottom-up DP approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Triangle in O(n log n) or better? Consider how bottom-up DP helps." },
      { level: 3, text: "The optimal solution uses bottom-up DP. Work through small examples to see the pattern." },
    ],
  },

  "perfect-squares": {
    pattern: "BFS / DP with squares",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the BFS / DP with squares approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Perfect Squares in O(n log n) or better? Consider how BFS / DP with squares helps." },
      { level: 3, text: "The optimal solution uses BFS / DP with squares. Work through small examples to see the pattern." },
    ],
  },

  "graph-valid-tree": {
    pattern: "union find / BFS cycle detection",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the union find / BFS cycle detection approach for graphs problems." },
      { level: 2, text: "Can you solve Graph Valid Tree in O(n log n) or better? Consider how union find / BFS cycle detection helps." },
      { level: 3, text: "The optimal solution uses union find / BFS cycle detection. Work through small examples to see the pattern." },
    ],
  },

  "accounts-merge": {
    pattern: "union find on emails",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the union find on emails approach for graphs problems." },
      { level: 2, text: "Can you solve Accounts Merge in O(n log n) or better? Consider how union find on emails helps." },
      { level: 3, text: "The optimal solution uses union find on emails. Work through small examples to see the pattern." },
    ],
  },

  "keys-and-rooms": {
    pattern: "DFS reachability",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS reachability approach for graphs problems." },
      { level: 2, text: "Can you solve Keys and Rooms in O(n log n) or better? Consider how DFS reachability helps." },
      { level: 3, text: "The optimal solution uses DFS reachability. Work through small examples to see the pattern." },
    ],
  },

  "find-the-town-judge": {
    pattern: "in-degree / out-degree",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the in-degree / out-degree approach for graphs problems." },
      { level: 2, text: "Can you solve Find the Town Judge in O(n log n) or better? Consider how in-degree / out-degree helps." },
      { level: 3, text: "The optimal solution uses in-degree / out-degree. Work through small examples to see the pattern." },
    ],
  },

  "all-paths-source-to-target": {
    pattern: "DFS backtracking on DAG",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS backtracking on DAG approach for graphs problems." },
      { level: 2, text: "Can you solve All Paths From Source to Target in O(n log n) or better? Consider how DFS backtracking on DAG helps." },
      { level: 3, text: "The optimal solution uses DFS backtracking on DAG. Work through small examples to see the pattern." },
    ],
  },

  "combination-sum": {
    pattern: "DFS with reuse",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS with reuse approach for backtracking problems." },
      { level: 2, text: "Can you solve Combination Sum in O(n log n) or better? Consider how DFS with reuse helps." },
      { level: 3, text: "The optimal solution uses DFS with reuse. Work through small examples to see the pattern." },
    ],
  },

  "combination-sum-ii": {
    pattern: "DFS with deduplication",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS with deduplication approach for backtracking problems." },
      { level: 2, text: "Can you solve Combination Sum II in O(n log n) or better? Consider how DFS with deduplication helps." },
      { level: 3, text: "The optimal solution uses DFS with deduplication. Work through small examples to see the pattern." },
    ],
  },

  "word-search": {
    pattern: "DFS grid with visited",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS grid with visited approach for backtracking problems." },
      { level: 2, text: "Can you solve Word Search in O(n log n) or better? Consider how DFS grid with visited helps." },
      { level: 3, text: "The optimal solution uses DFS grid with visited. Work through small examples to see the pattern." },
    ],
  },

  "palindrome-partitioning": {
    pattern: "DFS + palindrome check",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DFS + palindrome check approach for backtracking problems." },
      { level: 2, text: "Can you solve Palindrome Partitioning in O(n log n) or better? Consider how DFS + palindrome check helps." },
      { level: 3, text: "The optimal solution uses DFS + palindrome check. Work through small examples to see the pattern." },
    ],
  },

  "n-queens": {
    pattern: "column + diagonal tracking",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the column + diagonal tracking approach for backtracking problems." },
      { level: 2, text: "Can you solve N-Queens in O(n log n) or better? Consider how column + diagonal tracking helps." },
      { level: 3, text: "The optimal solution uses column + diagonal tracking. Work through small examples to see the pattern." },
    ],
  },

  "find-minimum-in-rotated-sorted-array": {
    pattern: "binary search on rotated array",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on rotated array approach for binary search problems." },
      { level: 2, text: "Can you solve Find Minimum in Rotated Sorted Array in O(n log n) or better? Consider how binary search on rotated array helps." },
      { level: 3, text: "The optimal solution uses binary search on rotated array. Work through small examples to see the pattern." },
    ],
  },

  "koko-eating-bananas": {
    pattern: "binary search on answer",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on answer approach for binary search problems." },
      { level: 2, text: "Can you solve Koko Eating Bananas in O(n log n) or better? Consider how binary search on answer helps." },
      { level: 3, text: "The optimal solution uses binary search on answer. Work through small examples to see the pattern." },
    ],
  },

  "search-in-rotated-sorted-array-ii": {
    pattern: "binary search with duplicates",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search with duplicates approach for binary search problems." },
      { level: 2, text: "Can you solve Search in Rotated Sorted Array II in O(n log n) or better? Consider how binary search with duplicates helps." },
      { level: 3, text: "The optimal solution uses binary search with duplicates. Work through small examples to see the pattern." },
    ],
  },

  "find-k-closest-elements": {
    pattern: "binary search on left bound",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on left bound approach for binary search problems." },
      { level: 2, text: "Can you solve Find K Closest Elements in O(n log n) or better? Consider how binary search on left bound helps." },
      { level: 3, text: "The optimal solution uses binary search on left bound. Work through small examples to see the pattern." },
    ],
  },

  "median-of-two-sorted-arrays": {
    pattern: "binary search on partition",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the binary search on partition approach for binary search problems." },
      { level: 2, text: "Can you solve Median of Two Sorted Arrays in O(n log n) or better? Consider how binary search on partition helps." },
      { level: 3, text: "The optimal solution uses binary search on partition. Work through small examples to see the pattern." },
    ],
  },

  "group-anagrams": {
    pattern: "sorted key grouping",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sorted key grouping approach for hash maps problems." },
      { level: 2, text: "Can you solve Group Anagrams in O(n log n) or better? Consider how sorted key grouping helps." },
      { level: 3, text: "The optimal solution uses sorted key grouping. Work through small examples to see the pattern." },
    ],
  },

  "longest-consecutive-sequence": {
    pattern: "hash set streak counting",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the hash set streak counting approach for hash maps problems." },
      { level: 2, text: "Can you solve Longest Consecutive Sequence in O(n log n) or better? Consider how hash set streak counting helps." },
      { level: 3, text: "The optimal solution uses hash set streak counting. Work through small examples to see the pattern." },
    ],
  },

  "subarray-sum-equals-k": {
    pattern: "prefix sum hash map",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the prefix sum hash map approach for hash maps problems." },
      { level: 2, text: "Can you solve Subarray Sum Equals K in O(n log n) or better? Consider how prefix sum hash map helps." },
      { level: 3, text: "The optimal solution uses prefix sum hash map. Work through small examples to see the pattern." },
    ],
  },

  "contiguous-array": {
    pattern: "prefix sum balance hash map",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the prefix sum balance hash map approach for hash maps problems." },
      { level: 2, text: "Can you solve Contiguous Array in O(n log n) or better? Consider how prefix sum balance hash map helps." },
      { level: 3, text: "The optimal solution uses prefix sum balance hash map. Work through small examples to see the pattern." },
    ],
  },

  "4sum-ii": {
    pattern: "two-sum complement counting",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two-sum complement counting approach for hash maps problems." },
      { level: 2, text: "Can you solve 4Sum II in O(n log n) or better? Consider how two-sum complement counting helps." },
      { level: 3, text: "The optimal solution uses two-sum complement counting. Work through small examples to see the pattern." },
    ],
  },

  "find-k-pairs-with-smallest-sums": {
    pattern: "min heap with index pairs",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the min heap with index pairs approach for heap problems." },
      { level: 2, text: "Can you solve Find K Pairs with Smallest Sums in O(n log n) or better? Consider how min heap with index pairs helps." },
      { level: 3, text: "The optimal solution uses min heap with index pairs. Work through small examples to see the pattern." },
    ],
  },

  "ugly-number-ii": {
    pattern: "min heap or DP three pointers",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the min heap or DP three pointers approach for heap problems." },
      { level: 2, text: "Can you solve Ugly Number II in O(n log n) or better? Consider how min heap or DP three pointers helps." },
      { level: 3, text: "The optimal solution uses min heap or DP three pointers. Work through small examples to see the pattern." },
    ],
  },

  "ipo": {
    pattern: "greedy with two heaps",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the greedy with two heaps approach for heap problems." },
      { level: 2, text: "Can you solve IPO in O(n log n) or better? Consider how greedy with two heaps helps." },
      { level: 3, text: "The optimal solution uses greedy with two heaps. Work through small examples to see the pattern." },
    ],
  },

  "single-thread-cpu": {
    pattern: "event simulation with min heap",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the event simulation with min heap approach for heap problems." },
      { level: 2, text: "Can you solve Single Thread CPU in O(n log n) or better? Consider how event simulation with min heap helps." },
      { level: 3, text: "The optimal solution uses event simulation with min heap. Work through small examples to see the pattern." },
    ],
  },

  "reorganize-string": {
    pattern: "max heap greedy",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the max heap greedy approach for heap problems." },
      { level: 2, text: "Can you solve Reorganize String in O(n log n) or better? Consider how max heap greedy helps." },
      { level: 3, text: "The optimal solution uses max heap greedy. Work through small examples to see the pattern." },
    ],
  },

  "word-break": {
    pattern: "DP with word set",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DP with word set approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Word Break in O(n log n) or better? Consider how DP with word set helps." },
      { level: 3, text: "The optimal solution uses DP with word set. Work through small examples to see the pattern." },
    ],
  },

  "implement-trie-prefix-tree": {
    pattern: "children array node",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the children array node approach for trie problems." },
      { level: 2, text: "Can you solve Implement Trie (Prefix Tree) in O(n log n) or better? Consider how children array node helps." },
      { level: 3, text: "The optimal solution uses children array node. Work through small examples to see the pattern." },
    ],
  },

  "add-and-search-word": {
    pattern: "trie with wildcard DFS",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the trie with wildcard DFS approach for trie problems." },
      { level: 2, text: "Can you solve Add and Search Word - Data structure design in O(n log n) or better? Consider how trie with wildcard DFS helps." },
      { level: 3, text: "The optimal solution uses trie with wildcard DFS. Work through small examples to see the pattern." },
    ],
  },

  "longest-word-in-dictionary": {
    pattern: "trie BFS/DFS level traversal",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the trie BFS/DFS level traversal approach for trie problems." },
      { level: 2, text: "Can you solve Longest Word in Dictionary in O(n log n) or better? Consider how trie BFS/DFS level traversal helps." },
      { level: 3, text: "The optimal solution uses trie BFS/DFS level traversal. Work through small examples to see the pattern." },
    ],
  },

  "replace-words": {
    pattern: "trie prefix replacement",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the trie prefix replacement approach for trie problems." },
      { level: 2, text: "Can you solve Replace Words in O(n log n) or better? Consider how trie prefix replacement helps." },
      { level: 3, text: "The optimal solution uses trie prefix replacement. Work through small examples to see the pattern." },
    ],
  },

  "isomorphic-strings": {
    pattern: "bidirectional character map",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bidirectional character map approach for hash maps problems." },
      { level: 2, text: "Can you solve Isomorphic Strings in O(n log n) or better? Consider how bidirectional character map helps." },
      { level: 3, text: "The optimal solution uses bidirectional character map. Work through small examples to see the pattern." },
    ],
  },

  "ransom-note": {
    pattern: "frequency count",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the frequency count approach for hash maps problems." },
      { level: 2, text: "Can you solve Ransom Note in O(n log n) or better? Consider how frequency count helps." },
      { level: 3, text: "The optimal solution uses frequency count. Work through small examples to see the pattern." },
    ],
  },

  "find-all-anagrams-in-string": {
    pattern: "fixed window frequency map",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the fixed window frequency map approach for sliding window problems." },
      { level: 2, text: "Can you solve Find All Anagrams in a String in O(n log n) or better? Consider how fixed window frequency map helps." },
      { level: 3, text: "The optimal solution uses fixed window frequency map. Work through small examples to see the pattern." },
    ],
  },

  "longest-repeating-character-replacement": {
    pattern: "max freq window expansion",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the max freq window expansion approach for sliding window problems." },
      { level: 2, text: "Can you solve Longest Repeating Character Replacement in O(n log n) or better? Consider how max freq window expansion helps." },
      { level: 3, text: "The optimal solution uses max freq window expansion. Work through small examples to see the pattern." },
    ],
  },

  "permutation-in-string": {
    pattern: "fixed window character count",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the fixed window character count approach for sliding window problems." },
      { level: 2, text: "Can you solve Permutation in String in O(n log n) or better? Consider how fixed window character count helps." },
      { level: 3, text: "The optimal solution uses fixed window character count. Work through small examples to see the pattern." },
    ],
  },

  "jump-game-ii": {
    pattern: "level-based greedy BFS",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the level-based greedy BFS approach for greedy problems." },
      { level: 2, text: "Can you solve Jump Game II in O(n log n) or better? Consider how level-based greedy BFS helps." },
      { level: 3, text: "The optimal solution uses level-based greedy BFS. Work through small examples to see the pattern." },
    ],
  },

  "house-robber": {
    pattern: "1D DP no adjacency",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 1D DP no adjacency approach for dynamic programming problems." },
      { level: 2, text: "Can you solve House Robber in O(n log n) or better? Consider how 1D DP no adjacency helps." },
      { level: 3, text: "The optimal solution uses 1D DP no adjacency. Work through small examples to see the pattern." },
    ],
  },

  "house-robber-ii": {
    pattern: "circular DP two passes",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the circular DP two passes approach for dynamic programming problems." },
      { level: 2, text: "Can you solve House Robber II in O(n log n) or better? Consider how circular DP two passes helps." },
      { level: 3, text: "The optimal solution uses circular DP two passes. Work through small examples to see the pattern." },
    ],
  },

  "coin-change": {
    pattern: "unbounded knapsack BFS/DP",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the unbounded knapsack BFS/DP approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Coin Change in O(n log n) or better? Consider how unbounded knapsack BFS/DP helps." },
      { level: 3, text: "The optimal solution uses unbounded knapsack BFS/DP. Work through small examples to see the pattern." },
    ],
  },

  "decode-ways": {
    pattern: "1D DP digit parsing",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 1D DP digit parsing approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Decode Ways in O(n log n) or better? Consider how 1D DP digit parsing helps." },
      { level: 3, text: "The optimal solution uses 1D DP digit parsing. Work through small examples to see the pattern." },
    ],
  },

  "counting-bits": {
    pattern: "DP with bit shift",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the DP with bit shift approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Counting Bits in O(n log n) or better? Consider how DP with bit shift helps." },
      { level: 3, text: "The optimal solution uses DP with bit shift. Work through small examples to see the pattern." },
    ],
  },

  "sum-of-two-integers": {
    pattern: "XOR and carry bit",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the XOR and carry bit approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Sum of Two Integers in O(n log n) or better? Consider how XOR and carry bit helps." },
      { level: 3, text: "The optimal solution uses XOR and carry bit. Work through small examples to see the pattern." },
    ],
  },

  "missing-number": {
    pattern: "XOR or Gauss sum",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the XOR or Gauss sum approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Missing Number in O(n log n) or better? Consider how XOR or Gauss sum helps." },
      { level: 3, text: "The optimal solution uses XOR or Gauss sum. Work through small examples to see the pattern." },
    ],
  },

  "reverse-bits": {
    pattern: "bit extraction and placement",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the bit extraction and placement approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Reverse Bits in O(n log n) or better? Consider how bit extraction and placement helps." },
      { level: 3, text: "The optimal solution uses bit extraction and placement. Work through small examples to see the pattern." },
    ],
  },

  "single-number-ii": {
    pattern: "count bits mod 3",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the count bits mod 3 approach for bit manipulation problems." },
      { level: 2, text: "Can you solve Single Number II in O(n log n) or better? Consider how count bits mod 3 helps." },
      { level: 3, text: "The optimal solution uses count bits mod 3. Work through small examples to see the pattern." },
    ],
  },

  "daily-temperatures": {
    pattern: "monotonic decreasing stack",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the monotonic decreasing stack approach for stacks problems." },
      { level: 2, text: "Can you solve Daily Temperatures in O(n log n) or better? Consider how monotonic decreasing stack helps." },
      { level: 3, text: "The optimal solution uses monotonic decreasing stack. Work through small examples to see the pattern." },
    ],
  },

  "car-fleet": {
    pattern: "monotonic stack on time-to-target",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the monotonic stack on time-to-target approach for stacks problems." },
      { level: 2, text: "Can you solve Car Fleet in O(n log n) or better? Consider how monotonic stack on time-to-target helps." },
      { level: 3, text: "The optimal solution uses monotonic stack on time-to-target. Work through small examples to see the pattern." },
    ],
  },

  "largest-rectangle-in-histogram": {
    pattern: "monotonic stack left-right boundaries",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the monotonic stack left-right boundaries approach for stacks problems." },
      { level: 2, text: "Can you solve Largest Rectangle in Histogram in O(n log n) or better? Consider how monotonic stack left-right boundaries helps." },
      { level: 3, text: "The optimal solution uses monotonic stack left-right boundaries. Work through small examples to see the pattern." },
    ],
  },

  "maximal-rectangle": {
    pattern: "histogram stack per row",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the histogram stack per row approach for stacks problems." },
      { level: 2, text: "Can you solve Maximal Rectangle in O(n log n) or better? Consider how histogram stack per row helps." },
      { level: 3, text: "The optimal solution uses histogram stack per row. Work through small examples to see the pattern." },
    ],
  },

  "evaluate-reverse-polish-notation": {
    pattern: "operand stack evaluation",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the operand stack evaluation approach for stacks problems." },
      { level: 2, text: "Can you solve Evaluate Reverse Polish Notation in O(n log n) or better? Consider how operand stack evaluation helps." },
      { level: 3, text: "The optimal solution uses operand stack evaluation. Work through small examples to see the pattern." },
    ],
  },

  "implement-queue-using-stacks": {
    pattern: "two stacks lazy transfer",
    estimatedTime: "10–20 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two stacks lazy transfer approach for stacks problems." },
      { level: 2, text: "Can you solve Implement Queue using Stacks in O(n log n) or better? Consider how two stacks lazy transfer helps." },
      { level: 3, text: "The optimal solution uses two stacks lazy transfer. Work through small examples to see the pattern." },
    ],
  },

  "minimum-stack": {
    pattern: "auxiliary min stack",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the auxiliary min stack approach for stacks problems." },
      { level: 2, text: "Can you solve Minimum Stack in O(n log n) or better? Consider how auxiliary min stack helps." },
      { level: 3, text: "The optimal solution uses auxiliary min stack. Work through small examples to see the pattern." },
    ],
  },

  "basic-calculator-ii": {
    pattern: "operator precedence stack",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the operator precedence stack approach for stacks problems." },
      { level: 2, text: "Can you solve Basic Calculator II in O(n log n) or better? Consider how operator precedence stack helps." },
      { level: 3, text: "The optimal solution uses operator precedence stack. Work through small examples to see the pattern." },
    ],
  },

  "asteroid-collision": {
    pattern: "collision simulation stack",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the collision simulation stack approach for stacks problems." },
      { level: 2, text: "Can you solve Asteroid Collision in O(n log n) or better? Consider how collision simulation stack helps." },
      { level: 3, text: "The optimal solution uses collision simulation stack. Work through small examples to see the pattern." },
    ],
  },

  "remove-k-digits": {
    pattern: "monotonic stack digit removal",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the monotonic stack digit removal approach for stacks problems." },
      { level: 2, text: "Can you solve Remove K Digits in O(n log n) or better? Consider how monotonic stack digit removal helps." },
      { level: 3, text: "The optimal solution uses monotonic stack digit removal. Work through small examples to see the pattern." },
    ],
  },

  "wildcard-matching": {
    pattern: "2D DP string matching",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP string matching approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Wildcard Matching in O(n log n) or better? Consider how 2D DP string matching helps." },
      { level: 3, text: "The optimal solution uses 2D DP string matching. Work through small examples to see the pattern." },
    ],
  },

  "regular-expression-matching": {
    pattern: "2D DP regex",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP regex approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Regular Expression Matching in O(n log n) or better? Consider how 2D DP regex helps." },
      { level: 3, text: "The optimal solution uses 2D DP regex. Work through small examples to see the pattern." },
    ],
  },

  "best-time-to-buy-sell-stock-iii": {
    pattern: "state machine DP",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the state machine DP approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Best Time to Buy and Sell Stock III in O(n log n) or better? Consider how state machine DP helps." },
      { level: 3, text: "The optimal solution uses state machine DP. Work through small examples to see the pattern." },
    ],
  },

  "maximal-square": {
    pattern: "2D DP min of neighbors",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the 2D DP min of neighbors approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Maximal Square in O(n log n) or better? Consider how 2D DP min of neighbors helps." },
      { level: 3, text: "The optimal solution uses 2D DP min of neighbors. Work through small examples to see the pattern." },
    ],
  },

  "candy": {
    pattern: "two-pass greedy",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two-pass greedy approach for greedy problems." },
      { level: 2, text: "Can you solve Candy in O(n log n) or better? Consider how two-pass greedy helps." },
      { level: 3, text: "The optimal solution uses two-pass greedy. Work through small examples to see the pattern." },
    ],
  },

  "partition-labels": {
    pattern: "last occurrence greedy",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the last occurrence greedy approach for greedy problems." },
      { level: 2, text: "Can you solve Partition Labels in O(n log n) or better? Consider how last occurrence greedy helps." },
      { level: 3, text: "The optimal solution uses last occurrence greedy. Work through small examples to see the pattern." },
    ],
  },

  "boats-to-save-people": {
    pattern: "two pointer greedy",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two pointer greedy approach for greedy problems." },
      { level: 2, text: "Can you solve Boats to Save People in O(n log n) or better? Consider how two pointer greedy helps." },
      { level: 3, text: "The optimal solution uses two pointer greedy. Work through small examples to see the pattern." },
    ],
  },

  "queue-reconstruction-by-height": {
    pattern: "sort + insert by k",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + insert by k approach for greedy problems." },
      { level: 2, text: "Can you solve Queue Reconstruction by Height in O(n log n) or better? Consider how sort + insert by k helps." },
      { level: 3, text: "The optimal solution uses sort + insert by k. Work through small examples to see the pattern." },
    ],
  },

  "wiggle-subsequence": {
    pattern: "sign change greedy",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sign change greedy approach for greedy problems." },
      { level: 2, text: "Can you solve Wiggle Subsequence in O(n log n) or better? Consider how sign change greedy helps." },
      { level: 3, text: "The optimal solution uses sign change greedy. Work through small examples to see the pattern." },
    ],
  },

  "minimum-arrows-burst-balloons": {
    pattern: "sort by end + greedy overlap",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort by end + greedy overlap approach for greedy problems." },
      { level: 2, text: "Can you solve Minimum Number of Arrows to Burst Balloons in O(n log n) or better? Consider how sort by end + greedy overlap helps." },
      { level: 3, text: "The optimal solution uses sort by end + greedy overlap. Work through small examples to see the pattern." },
    ],
  },

  "trapping-rain-water": {
    pattern: "two pointer max left right",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the two pointer max left right approach for two pointers problems." },
      { level: 2, text: "Can you solve Trapping Rain Water in O(n log n) or better? Consider how two pointer max left right helps." },
      { level: 3, text: "The optimal solution uses two pointer max left right. Work through small examples to see the pattern." },
    ],
  },

  "container-with-most-water": {
    pattern: "shrink from both ends",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the shrink from both ends approach for two pointers problems." },
      { level: 2, text: "Can you solve Container With Most Water in O(n log n) or better? Consider how shrink from both ends helps." },
      { level: 3, text: "The optimal solution uses shrink from both ends. Work through small examples to see the pattern." },
    ],
  },

  "alien-dictionary": {
    pattern: "topological sort on characters",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the topological sort on characters approach for graphs problems." },
      { level: 2, text: "Can you solve Alien Dictionary in O(n log n) or better? Consider how topological sort on characters helps." },
      { level: 3, text: "The optimal solution uses topological sort on characters. Work through small examples to see the pattern." },
    ],
  },

  "network-delay-time": {
    pattern: "Dijkstra shortest path",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Dijkstra shortest path approach for graphs problems." },
      { level: 2, text: "Can you solve Network Delay Time in O(n log n) or better? Consider how Dijkstra shortest path helps." },
      { level: 3, text: "The optimal solution uses Dijkstra shortest path. Work through small examples to see the pattern." },
    ],
  },

  "walls-and-gates": {
    pattern: "multi-source BFS",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the multi-source BFS approach for graphs problems." },
      { level: 2, text: "Can you solve Walls and Gates in O(n log n) or better? Consider how multi-source BFS helps." },
      { level: 3, text: "The optimal solution uses multi-source BFS. Work through small examples to see the pattern." },
    ],
  },

  "swim-in-rising-water": {
    pattern: "Dijkstra minimax path",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Dijkstra minimax path approach for graphs problems." },
      { level: 2, text: "Can you solve Swim in Rising Water in O(n log n) or better? Consider how Dijkstra minimax path helps." },
      { level: 3, text: "The optimal solution uses Dijkstra minimax path. Work through small examples to see the pattern." },
    ],
  },

  "find-the-duplicate-number": {
    pattern: "Floyd cycle detection",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Floyd cycle detection approach for two pointers problems." },
      { level: 2, text: "Can you solve Find the Duplicate Number in O(n log n) or better? Consider how Floyd cycle detection helps." },
      { level: 3, text: "The optimal solution uses Floyd cycle detection. Work through small examples to see the pattern." },
    ],
  },

  "minimum-interval-to-include-each-query": {
    pattern: "offline queries + sorted sweep + min heap",
    estimatedTime: "35–60 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the offline queries + sorted sweep + min heap approach for heap problems." },
      { level: 2, text: "Can you solve Minimum Interval to Include Each Query in O(n log n) or better? Consider how offline queries + sorted sweep + min heap helps." },
      { level: 3, text: "The optimal solution uses offline queries + sorted sweep + min heap. Work through small examples to see the pattern." },
    ],
  },

  "maximum-subarray": {
    pattern: "Kadane's algorithm",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the Kadane's algorithm approach for dynamic programming problems." },
      { level: 2, text: "Can you solve Maximum Subarray in O(n log n) or better? Consider how Kadane's algorithm helps." },
      { level: 3, text: "The optimal solution uses Kadane's algorithm. Work through small examples to see the pattern." },
    ],
  },

  "3sum-closest": {
    pattern: "sort + two pointer closest",
    estimatedTime: "20–35 min",
    companies: [],
    relatedProblems: [],
    hints: [
      { level: 1, text: "Think about the sort + two pointer closest approach for two pointers problems." },
      { level: 2, text: "Can you solve 3Sum Closest in O(n log n) or better? Consider how sort + two pointer closest helps." },
      { level: 3, text: "The optimal solution uses sort + two pointer closest. Work through small examples to see the pattern." },
    ],
  },

};

export default problemMetadata;
