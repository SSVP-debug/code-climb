const hiddentestcases = {
  "two-sum": [
    { input: { nums: [1, 2, 3, 4, 5], target: 9 }, expectedOutput: [3, 4] },
    { input: { nums: [-1, 0], target: -1 }, expectedOutput: [0, 1] },
  ],

  "contains-duplicate": [
    { input: { nums: [1] }, expectedOutput: false },
    { input: { nums: [1, 1] }, expectedOutput: true },
  ],

  "best-time-to-buy-and-sell-stock": [
    { input: { prices: [2, 4, 1] }, expectedOutput: 2 },
    { input: { prices: [1, 2, 3, 4, 5] }, expectedOutput: 4 },
  ],

  "valid-parentheses": [
    { input: { s: "([)]" }, expectedOutput: false },
    { input: { s: "{[]}" }, expectedOutput: true },
  ],

  "maximum-subarray": [
    { input: { nums: [-1] }, expectedOutput: -1 },
    { input: { nums: [-2, -1] }, expectedOutput: -1 },
  ],

  "climbing-stairs": [
    { input: { n: 1 }, expectedOutput: 1 },
    { input: { n: 10 }, expectedOutput: 89 },
  ],

  "single-number": [
    { input: { nums: [0, 0, 3] }, expectedOutput: 3 },
    { input: { nums: [-1, -1, 5] }, expectedOutput: 5 },
  ],

  "fibonacci-number": [
    { input: { n: 0 }, expectedOutput: 0 },
    { input: { n: 10 }, expectedOutput: 55 },
  ],

  "longest-substring-without-repeating-characters": [
    { input: { s: "" }, expectedOutput: 0 },
    { input: { s: "dvdf" }, expectedOutput: 3 },
  ],

  "valid-anagram": [
    { input: { s: "a", t: "a" }, expectedOutput: true },
    { input: { s: "listen", t: "silent" }, expectedOutput: true },
  ],

  "container-with-most-water": [
    { input: { height: [1, 2, 1] }, expectedOutput: 2 },
    { input: { height: [2, 3, 4, 5, 18, 17, 6] }, expectedOutput: 17 },
  ],

  "house-robber": [
    { input: { nums: [2, 1, 1, 2] }, expectedOutput: 4 },
    { input: { nums: [1] }, expectedOutput: 1 },
  ],

  "coin-change": [
    { input: { coins: [1], amount: 0 }, expectedOutput: 0 },
    { input: { coins: [2, 5, 10, 1], amount: 27 }, expectedOutput: 4 },
  ],

  "find-minimum-in-rotated-sorted-array": [
    { input: { nums: [1] }, expectedOutput: 1 },
    { input: { nums: [2, 1] }, expectedOutput: 1 },
  ],

  "majority-element": [
    { input: { nums: [6, 5, 5] }, expectedOutput: 5 },
    { input: { nums: [1, 1, 1, 2, 3] }, expectedOutput: 1 },
  ],

  "longest-common-prefix": [
    { input: { strs: ["a"] }, expectedOutput: "a" },
    { input: { strs: ["ab", "a"] }, expectedOutput: "a" },
  ],

  "trapping-rain-water": [
    { input: { height: [1, 0, 1] }, expectedOutput: 1 },
    { input: { height: [2, 0, 2] }, expectedOutput: 2 },
  ],

  "word-break": [
    { input: { s: "a", wordDict: ["a"] }, expectedOutput: true },
    { input: { s: "bb", wordDict: ["a", "b", "bbb", "bbbb"] }, expectedOutput: true },
  ],

  "decode-ways": [
    { input: { s: "1" }, expectedOutput: 1 },
    { input: { s: "11106" }, expectedOutput: 2 },
  ],

  "jump-game-ii": [
    { input: { nums: [1, 1, 1, 1] }, expectedOutput: 3 },
    { input: { nums: [1, 2, 1, 1, 1] }, expectedOutput: 3 },
  ],

  "move-zeroes": [
    { input: { nums: [0, 0, 1] }, expectedOutput: [1, 0, 0] },
    { input: { nums: [4, 2, 0, 1, 0, 5] }, expectedOutput: [4, 2, 1, 5, 0, 0] },
  ],

  "min-stack": [
    { input: { ops: [["push", 10], ["push", 5], ["push", 15], ["getMin"], ["pop"], ["getMin"], ["top"]] }, expectedOutput: [5, 5, 10] },
  ],

  "daily-temperatures": [
    { input: { temperatures: [89, 62, 70, 58, 47, 47, 46, 76, 100, 70] }, expectedOutput: [8, 1, 5, 4, 3, 2, 1, 1, 0, 0] },
  ],

  "reverse-linked-list": [
    { input: { head: [1] }, expectedOutput: [1] },
    { input: { head: [3, 1, 4, 1, 5, 9, 2, 6] }, expectedOutput: [6, 2, 9, 5, 1, 4, 1, 3] },
  ],

  "merge-two-sorted-lists": [
    { input: { list1: [1], list2: [2] }, expectedOutput: [1, 2] },
    { input: { list1: [1, 3, 5, 7], list2: [2, 4, 6, 8] }, expectedOutput: [1, 2, 3, 4, 5, 6, 7, 8] },
  ],

  "middle-of-the-linked-list": [
    { input: { head: [1, 2] }, expectedOutput: 2 },
    { input: { head: [10, 20, 30, 40] }, expectedOutput: 30 },
  ],

  "remove-nth-node-from-end": [
    { input: { head: [1, 2], n: 2 }, expectedOutput: [2] },
    { input: { head: [1, 2, 3, 4, 5], n: 5 }, expectedOutput: [2, 3, 4, 5] },
  ],

  "two-sum-ii-sorted": [
    { input: { numbers: [1, 2, 3, 4, 5], target: 9 }, expectedOutput: [4, 5] },
    { input: { numbers: [5, 25, 75], target: 100 }, expectedOutput: [2, 3] },
  ],

  "three-sum": [
    { input: { nums: [-2, 0, 1, 1, 2] }, expectedOutput: 2 },
    { input: { nums: [1, 2, -2, -1] }, expectedOutput: 0 },
  ],

  "minimum-size-subarray-sum": [
    { input: { target: 15, nums: [1, 2, 3, 4, 5] }, expectedOutput: 5 },
    { input: { target: 6, nums: [10, 2, 3] }, expectedOutput: 1 },
  ],

  "maximum-average-subarray": [
    { input: { nums: [3, 3, 3, 3, 3], k: 3 }, expectedOutput: 3 },
    { input: { nums: [-1, -12, -5], k: 2 }, expectedOutput: -6.5 },
  ],

  "binary-search": [
    { input: { nums: [1, 3, 5, 7, 9, 11], target: 7 }, expectedOutput: 3 },
    { input: { nums: [2, 4, 6, 8, 10], target: 1 }, expectedOutput: -1 },
  ],

  "search-in-rotated-sorted-array": [
    { input: { nums: [3, 1], target: 1 }, expectedOutput: 1 },
    { input: { nums: [5, 1, 3], target: 5 }, expectedOutput: 0 },
  ],

  "group-anagrams": [
    { input: { strs: ["abc", "bca", "cab", "xyz"] }, expectedOutput: 2 },
    { input: { strs: ["a", "b", "c"] }, expectedOutput: 3 },
  ],

  "longest-consecutive-sequence": [
    { input: { nums: [1, 2, 3, 4, 5] }, expectedOutput: 5 },
    { input: { nums: [9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6] }, expectedOutput: 7 },
  ],

  "two-sum-count-pairs": [
    { input: { nums: [0, 0, 0, 0], target: 0 }, expectedOutput: 6 },
    { input: { nums: [5, 5, 5, 5, 5], target: 10 }, expectedOutput: 10 },
  ],

  "reverse-string": [
    { input: { s: "abcde" }, expectedOutput: "edcba" },
    { input: { s: "racecar" }, expectedOutput: "racecar" },
  ],

  "is-palindrome": [
    { input: { s: "Was it a car or a cat I saw?" }, expectedOutput: true },
    { input: { s: "hello" }, expectedOutput: false },
  ],

  "kth-largest-element": [
    { input: { nums: [5, 2, 4, 1, 3, 6, 0], k: 3 }, expectedOutput: 4 },
    { input: { nums: [7, 6, 5, 4, 3, 2, 1], k: 5 }, expectedOutput: 3 },
  ],

  "last-stone-weight": [
    { input: { stones: [10, 4, 2, 10] }, expectedOutput: 2 },
    { input: { stones: [1, 1, 1, 1] }, expectedOutput: 0 },
  ],

  "subsets": [
    { input: { nums: [1, 2, 3, 4] }, expectedOutput: 16 },
    { input: { nums: [5] }, expectedOutput: 2 },
  ],

  "combination-sum": [
    { input: { candidates: [3, 5, 7], target: 12 }, expectedOutput: 2 },
    { input: { candidates: [1, 2], target: 4 }, expectedOutput: 4 },
  ],

  "letter-case-permutations": [
    { input: { s: "abc" }, expectedOutput: 8 },
    { input: { s: "C" }, expectedOutput: 2 },
  ],

  "maximum-depth-of-binary-tree": [
    { input: { root: [1] }, expectedOutput: 1 },
    { input: { root: [1, 2, 3, 4, 5] }, expectedOutput: 3 },
  ],

  "invert-binary-tree": [
    { input: { root: [1] }, expectedOutput: [1] },
    { input: { root: [1, 2, -1] }, expectedOutput: [1, -1, 2] },
  ],

  "diameter-of-binary-tree": [
    { input: { root: [1, 2, 3, 4, 5, -1, -1, 6] }, expectedOutput: 4 },
    { input: { root: [1, -1, 2, -1, -1, -1, 3] }, expectedOutput: 2 },
  ],

  "validate-binary-search-tree": [
    { input: { root: [5, 4, 6, -1, -1, 3, 7] }, expectedOutput: false },
    { input: { root: [10, 5, 15, -1, -1, 12, 20] }, expectedOutput: true },
  ],

  "same-tree": [
    { input: { p: [], q: [] }, expectedOutput: true },
    { input: { p: [1], q: [1] }, expectedOutput: true },
  ],

  "flood-fill": [
    { input: { image: [0, 0, 0, 0, 1, 1, 0, 1, 1], numCols: 3, sr: 1, sc: 1, color: 5 }, expectedOutput: [0, 0, 0, 0, 5, 5, 0, 5, 5] },
  ],

  "number-of-islands": [
    { input: { grid: [0, 0, 0, 0, 0], numCols: 5 }, expectedOutput: 0 },
    { input: { grid: [1, 0, 1, 0, 1], numCols: 5 }, expectedOutput: 3 },
  ],

  "product-of-array-except-self": [
      { input: { nums: [1,1,1,1] }, expectedOutput: [1,1,1,1] },
      { input: { nums: [0,0] }, expectedOutput: [0,0] },
      { input: { nums: [-1,-2,-3] }, expectedOutput: [6,3,2] },
    ],
  "find-all-duplicates-in-array": [
      { input: { nums: [2,2,3,3] }, expectedOutput: [2,3] },
      { input: { nums: [1,2,3,4] }, expectedOutput: [] },
    ],
  "rotate-array": [
      { input: { nums: [1], k: 0 }, expectedOutput: [1] },
      { input: { nums: [1,2,3], k: 3 }, expectedOutput: [1,2,3] },
    ],
  "sort-colors": [
      { input: { nums: [1,0] }, expectedOutput: [0,1] },
      { input: { nums: [2,2,0,0,1,1] }, expectedOutput: [0,0,1,1,2,2] },
    ],
  "next-permutation": [
      { input: { nums: [1] }, expectedOutput: [1] },
      { input: { nums: [1,3,2] }, expectedOutput: [2,1,3] },
    ],
  "longest-palindromic-substring": [
      { input: { s: "ac" }, expectedOutput: "a" },
      { input: { s: "racecar" }, expectedOutput: "racecar" },
      { input: { s: "aacabdkacaa" }, expectedOutput: "aca" },
    ],
  "string-to-integer-atoi": [
      { input: { s: "words and 987" }, expectedOutput: 0 },
      { input: { s: "-91283472332" }, expectedOutput: -2147483648 },
      { input: { s: "  +  413" }, expectedOutput: 0 },
    ],
  "count-and-say": [
      { input: { n: 5 }, expectedOutput: "111221" },
      { input: { n: 6 }, expectedOutput: "312211" },
    ],
  "minimum-window-substring": [
      { input: { s: "abc", t: "cba" }, expectedOutput: "abc" },
      { input: { s: "bba", t: "ab" }, expectedOutput: "ba" },
    ],
  "encode-and-decode-strings": [
      { input: { strs: ["hello","world"] }, expectedOutput: ["hello","world"] },
      { input: { strs: ["#","##"] }, expectedOutput: ["#","##"] },
    ],
  "linked-list-cycle": [
      { input: { head: [], pos: -1 }, expectedOutput: false },
      { input: { head: [1,2,3,4,5], pos: 2 }, expectedOutput: true },
    ],
  "reorder-list": [
      { input: { head: [1,2] }, expectedOutput: [1,2] },
      { input: { head: [1,2,3] }, expectedOutput: [1,3,2] },
    ],
  "lru-cache": [
      { input: { capacity: 1, operations: [["put",1,1],["get",1],["put",2,2],["get",1],["get",2]] }, expectedOutput: [1,-1,2] },
    ],
  "intersection-of-two-linked-lists": [
      { input: { listA: [1], listB: [1], intersectVal: 1, skipA: 0, skipB: 0 }, expectedOutput: 1 },
    ],
  "palindrome-linked-list": [
      { input: { head: [1,2,3,2,1] }, expectedOutput: true },
      { input: { head: [1,0,0] }, expectedOutput: false },
    ],
  "binary-tree-level-order-traversal": [
      { input: { root: [1,2,3,4,5] }, expectedOutput: [[1],[2,3],[4,5]] },
      { input: { root: [0] }, expectedOutput: [[0]] },
    ],
  "lowest-common-ancestor-of-bst": [
      { input: { root: [6,2,8], p: 2, q: 8 }, expectedOutput: 6 },
      { input: { root: [3,1,4,null,2], p: 1, q: 4 }, expectedOutput: 3 },
    ],
  "construct-binary-tree-from-preorder-inorder": [
      { input: { preorder: [1,2,3], inorder: [2,1,3] }, expectedOutput: [1,2,3] },
      { input: { preorder: [1,2], inorder: [2,1] }, expectedOutput: [1,2] },
    ],
  "serialize-deserialize-binary-tree": [
      { input: { root: [1,2] }, expectedOutput: [1,2] },
      { input: { root: [1,null,2,null,3] }, expectedOutput: [1,null,2,null,3] },
    ],
  "binary-tree-right-side-view": [
      { input: { root: [1] }, expectedOutput: [1] },
      { input: { root: [1,2,3,4] }, expectedOutput: [1,3,4] },
    ],
  "clone-graph": [
      { input: { adjList: [[2],[1]] }, expectedOutput: [[2],[1]] },
    ],
  "course-schedule": [
      { input: { numCourses: 3, prerequisites: [[1,0],[2,1]] }, expectedOutput: true },
      { input: { numCourses: 3, prerequisites: [[1,0],[0,2],[2,1]] }, expectedOutput: false },
    ],
  "pacific-atlantic-water-flow": [
      { input: { heights: [[1,1],[1,1]] }, expectedOutput: [[0,0],[0,1],[1,0],[1,1]] },
    ],
  "rotting-oranges": [
      { input: { grid: [[1]] }, expectedOutput: -1 },
      { input: { grid: [[2,2],[1,1],[0,0]] }, expectedOutput: 1 },
    ],
  "word-ladder": [
      { input: { beginWord: "a", endWord: "c", wordList: ["a","b","c"] }, expectedOutput: 2 },
    ],
  "unique-paths": [
      { input: { m: 7, n: 3 }, expectedOutput: 28 },
      { input: { m: 2, n: 2 }, expectedOutput: 2 },
    ],
  "longest-increasing-subsequence": [
      { input: { nums: [1] }, expectedOutput: 1 },
      { input: { nums: [3,5,6,2,5,4,19,5,6,7,12] }, expectedOutput: 6 },
    ],
  "edit-distance": [
      { input: { word1: "abc", word2: "abc" }, expectedOutput: 0 },
      { input: { word1: "abc", word2: "" }, expectedOutput: 3 },
    ],
  "partition-equal-subset-sum": [
      { input: { nums: [1,1] }, expectedOutput: true },
      { input: { nums: [1,2,5] }, expectedOutput: false },
    ],
  "burst-balloons": [
      { input: { nums: [7,9,8,0,7,1,3,5,5,2,3] }, expectedOutput: 1654 },
    ],
  "top-k-frequent-elements": [
      { input: { nums: [1,2], k: 2 }, expectedOutput: [1,2] },
      { input: { nums: [5,5,5,3,3,1], k: 1 }, expectedOutput: [5] },
    ],
  "find-median-from-data-stream": [
      { input: { ops: ["addNum","findMedian"], vals: [[1],[]] }, expectedOutput: [1.0] },
      { input: { ops: ["addNum","addNum","findMedian"], vals: [[2],[3],[]] }, expectedOutput: [2.5] },
    ],
  "k-closest-points-to-origin": [
      { input: { points: [[0,0],[1,1]], k: 1 }, expectedOutput: [[0,0]] },
      { input: { points: [[-5,4],[-6,-5],[4,6]], k: 2 }, expectedOutput: [[-5,4],[4,6]] },
    ],
  "task-scheduler": [
      { input: { tasks: ["A"], n: 5 }, expectedOutput: 1 },
      { input: { tasks: ["A","A","B","B"], n: 2 }, expectedOutput: 5 },
    ],
  "merge-k-sorted-lists": [
      { input: { lists: [[1],[2],[3]] }, expectedOutput: [1,2,3] },
      { input: { lists: [[-1,0,5],[2,4]] }, expectedOutput: [-1,0,2,4,5] },
    ],
  "search-a-2d-matrix": [
      { input: { matrix: [[1,3]], target: 3 }, expectedOutput: true },
      { input: { matrix: [[1,3]], target: 2 }, expectedOutput: false },
    ],
  "koko-eating-bananas": [
      { input: { piles: [312884470], h: 312884469 }, expectedOutput: 2 },
      { input: { piles: [1,1,1,999999999], h: 10 }, expectedOutput: 142857143 },
    ],
  "time-based-key-value-store": [
      { input: { ops: ["set","get","get"], vals: [["a","b",1],["a",1],["a",2]] }, expectedOutput: ["b","b"] },
    ],
  "median-of-two-sorted-arrays": [
      { input: { nums1: [], nums2: [1] }, expectedOutput: 1.0 },
      { input: { nums1: [2], nums2: [] }, expectedOutput: 2.0 },
    ],
  "find-peak-element": [
      { input: { nums: [3,2,1] }, expectedOutput: 0 },
      { input: { nums: [1,2] }, expectedOutput: 1 },
    ],
  "permutations": [
      { input: { nums: [1,2] }, expectedOutput: [[1,2],[2,1]] },
    ],
  "sudoku-solver": [],
  "generate-parentheses": [
      { input: { n: 4 }, expectedOutput: ["(((())))","((()()))","((())())","((()))()","(()(()))","(()()())","(()())()","(())(())","(())()()","()((())) ","()((()))","()(()())","()(())()","()()(())","()()()()"].map(s=>s.trim()) },
    ],
  "word-search": [
      { input: { board: [["a"]], word: "a" }, expectedOutput: true },
      { input: { board: [["a","b"],["c","d"]], word: "abdc" }, expectedOutput: true },
    ],
  "n-queens": [
      { input: { n: 2 }, expectedOutput: [] },
      { input: { n: 3 }, expectedOutput: [] },
    ],
  "implement-trie": [
      { input: { ops: ["insert","search","startsWith"], vals: [["hello"],["hello"],["hel"]] }, expectedOutput: [true,true] },
    ],
  "word-search-ii": [
      { input: { board: [["a"]], words: ["a"] }, expectedOutput: ["a"] },
    ],
  "design-add-search-words": [
      { input: { ops: ["addWord","search","search"], vals: [["a"],["a"],["."]] }, expectedOutput: [true,true] },
    ],
  "maximum-xor-of-two-numbers": [
      { input: { nums: [2,4] }, expectedOutput: 6 },
      { input: { nums: [14,70,53,83,49,91,36,80,92,51,66,70] }, expectedOutput: 127 },
    ],
  "replace-words": [
      { input: { dictionary: ["e","b"], sentence: "eae ea ebee" }, expectedOutput: "e e e" },
    ],
  "four-sum": [
      { input: { nums: [-1,0,1,2,-1,-4], target: -1 }, expectedOutput: [[-4,1,1,1],[-1,-1,0,1]] },
    ],
  "longest-repeating-character-replacement": [
      { input: { s: "A", k: 0 }, expectedOutput: 1 },
      { input: { s: "ABCDE", k: 1 }, expectedOutput: 2 },
    ],
  "permutation-in-string": [
      { input: { s1: "hello", s2: "ooolleoooleh" }, expectedOutput: false },
      { input: { s1: "a", s2: "ab" }, expectedOutput: true },
    ],
  "fruit-into-baskets": [
      { input: { fruits: [3,3,3,1,2,1,1,2,3,3,4] }, expectedOutput: 5 },
      { input: { fruits: [1] }, expectedOutput: 1 },
    ],
  "subarray-sum-equals-k": [
      { input: { nums: [-1,-1,1], k: 0 }, expectedOutput: 1 },
      { input: { nums: [1,2,1,2,1], k: 3 }, expectedOutput: 4 },
    ],
  "jump-game": [
      { input: { nums: [2,0,0] }, expectedOutput: true },
      { input: { nums: [1,0,1,0] }, expectedOutput: false },
    ],
  "gas-station": [
      { input: { gas: [1,2], cost: [2,1] }, expectedOutput: 1 },
      { input: { gas: [3,1,1], cost: [1,2,2] }, expectedOutput: 0 },
    ],
  "hand-of-straights": [
      { input: { hand: [8,10,12], groupSize: 3 }, expectedOutput: false },
      { input: { hand: [1,2,3], groupSize: 1 }, expectedOutput: true },
    ],
  "merge-intervals": [
      { input: { intervals: [[1,4],[0,4]] }, expectedOutput: [[0,4]] },
      { input: { intervals: [[1,4],[0,0]] }, expectedOutput: [[0,0],[1,4]] },
    ],
  "non-overlapping-intervals": [
      { input: { intervals: [[-52,31],[-73,-26],[82,97],[-65,-11],[-62,-49],[95,99],[58,95],[-31,49],[66,98],[-63,2],[30,47],[-40,-26]] }, expectedOutput: 7 },
    ],
  "counting-bits": [
      { input: { n: 1 }, expectedOutput: [0,1] },
      { input: { n: 8 }, expectedOutput: [0,1,1,2,1,2,2,3,1] },
    ],
  "reverse-bits": [
      { input: { n: 0 }, expectedOutput: 0 },
      { input: { n: 1 }, expectedOutput: 2147483648 },
    ],
  "missing-number": [
      { input: { nums: [0] }, expectedOutput: 1 },
      { input: { nums: [1] }, expectedOutput: 0 },
    ],
  "number-of-1-bits": [
      { input: { n: 1 }, expectedOutput: 1 },
      { input: { n: 7 }, expectedOutput: 3 },
    ],
  "sum-of-two-integers": [
      { input: { a: -12, b: -8 }, expectedOutput: -20 },
      { input: { a: 0, b: 0 }, expectedOutput: 0 },
    ],
  "maximum-product-subarray": [
      { input: { nums: [3,-1,4] }, expectedOutput: 4 },
      { input: { nums: [-3,-1,-1] }, expectedOutput: 3 },
    ],
  "longest-common-subsequence": [
      { input: { text1: "bl", text2: "yby" }, expectedOutput: 1 },
      { input: { text1: "bsbininm", text2: "jmjkbkjkv" }, expectedOutput: 2 },
    ],
  "palindrome-partitioning": [
      { input: { s: "aba" }, expectedOutput: [["a","b","a"],["aba"]] },
    ],
  "house-robber-ii": [
      { input: { nums: [0] }, expectedOutput: 0 },
      { input: { nums: [200,3,140,20,10] }, expectedOutput: 340 },
    ],
  "regular-expression-matching": [
      { input: { s: "aab", p: "c*a*b" }, expectedOutput: true },
      { input: { s: "mississippi", p: "mis*is*p*." }, expectedOutput: false },
    ],
  "largest-rectangle-in-histogram": [
      { input: { heights: [0,9] }, expectedOutput: 9 },
      { input: { heights: [6,7,5,2,4,5,9,3] }, expectedOutput: 16 },
    ],
  "car-fleet": [
      { input: { target: 10, position: [6,8], speed: [3,2] }, expectedOutput: 2 },
    ],
  "evaluate-reverse-polish-notation": [
      { input: { tokens: ["3","11","5","+","-"] }, expectedOutput: -13 },
      { input: { tokens: ["2"] }, expectedOutput: 2 },
    ],
  "basic-calculator-ii": [
      { input: { s: "100000000/1/2/3/4/5/6/7/8/9/10" }, expectedOutput: 27 },
      { input: { s: "1*2-3/4+5*6-7*8+9/10" }, expectedOutput: -24 },
    ],
  "implement-queue-using-stacks": [
      { input: { ops: ["push","push","pop","push","pop","pop"], vals: [[1],[2],[],[3],[],[]] }, expectedOutput: [1,2,3] },
    ],
  "network-delay-time": [
      { input: { times: [[1,2,1],[2,3,2],[1,3,4]], n: 3, k: 1 }, expectedOutput: 3 },
    ],
  "cheapest-flights-within-k-stops": [
      { input: { n: 3, flights: [[0,1,100],[1,2,100],[0,2,500]], src: 0, dst: 2, k: 0 }, expectedOutput: 500 },
    ],
  "min-cost-to-connect-all-points": [
      { input: { points: [[0,0],[1,1],[1,0],[0,1]] }, expectedOutput: 3 },
    ],
  "number-of-connected-components": [
      { input: { n: 1, edges: [] }, expectedOutput: 1 },
      { input: { n: 4, edges: [[0,1],[2,3]] }, expectedOutput: 2 },
    ],
  "redundant-connection": [
      { input: { edges: [[1,2],[2,3],[1,3]] }, expectedOutput: [1,3] },
    ],
  "merge-intervals": [
      { input: { intervals: [[1,4],[0,4]] }, expectedOutput: [[0,4]] },
      { input: { intervals: [[1,4],[2,3]] }, expectedOutput: [[1,4]] },
    ],
  "insert-interval": [
      { input: { intervals: [[1,5]], newInterval: [2,3] }, expectedOutput: [[1,5]] },
      { input: { intervals: [[1,5]], newInterval: [6,8] }, expectedOutput: [[1,5],[6,8]] },
    ],
  "non-overlapping-intervals": [
      { input: { intervals: [[-52,31],[-73,-26],[82,97],[-65,-11],[-62,-49],[95,99],[58,95],[-31,49],[66,98],[-63,2],[30,47],[-40,-26]] }, expectedOutput: 7 },
    ],
  "meeting-rooms": [
      { input: { intervals: [[1,5],[5,10]] }, expectedOutput: true },
      { input: { intervals: [[1,5],[4,10]] }, expectedOutput: false },
    ],
  "meeting-rooms-ii": [
      { input: { intervals: [[1,4],[2,5],[7,9]] }, expectedOutput: 2 },
      { input: { intervals: [[6,15],[13,20],[6,17]] }, expectedOutput: 3 },
    ],
  "set-matrix-zeroes": [
      { input: { matrix: [[1,0]] }, expectedOutput: [[0,0]] },
      { input: { matrix: [[1,2],[0,4]] }, expectedOutput: [[0,2],[0,0]] },
    ],
  "spiral-matrix": [
      { input: { matrix: [[1,2],[3,4]] }, expectedOutput: [1,2,4,3] },
      { input: { matrix: [[7],[9],[6]] }, expectedOutput: [7,9,6] },
    ],
  "rotate-image": [
      { input: { matrix: [[1]] }, expectedOutput: [[1]] },
      { input: { matrix: [[1,2],[3,4]] }, expectedOutput: [[3,1],[4,2]] },
    ],
  "search-a-2d-matrix": [
      { input: { matrix: [[1]], target: 2 }, expectedOutput: false },
      { input: { matrix: [[1,3],[5,7]], target: 5 }, expectedOutput: true },
    ],
  "game-of-life": [
      { input: { board: [[1]] }, expectedOutput: [[0]] },
      { input: { board: [[0,0,0],[0,0,0],[0,0,0]] }, expectedOutput: [[0,0,0],[0,0,0],[0,0,0]] },
    ],
  "reverse-integer": [
      { input: { x: 0 }, expectedOutput: 0 },
      { input: { x: 1534236469 }, expectedOutput: 0 },
    ],
  "palindrome-number": [
      { input: { x: 0 }, expectedOutput: true },
      { input: { x: 1000021 }, expectedOutput: false },
    ],
  "happy-number": [
      { input: { n: 7 }, expectedOutput: true },
      { input: { n: 4 }, expectedOutput: false },
    ],
  "power-of-two": [
      { input: { n: 0 }, expectedOutput: false },
      { input: { n: -16 }, expectedOutput: false },
    ],
  "excel-sheet-column-number": [
      { input: { columnTitle: "Z" }, expectedOutput: 26 },
      { input: { columnTitle: "AA" }, expectedOutput: 27 },
    ],
  "count-primes": [
      { input: { n: 2 }, expectedOutput: 0 },
      { input: { n: 20 }, expectedOutput: 8 },
    ],
  "sqrt-x": [
      { input: { x: 1 }, expectedOutput: 1 },
      { input: { x: 2147395599 }, expectedOutput: 46339 },
    ],
  "roman-to-integer": [
      { input: { s: "IV" }, expectedOutput: 4 },
      { input: { s: "IX" }, expectedOutput: 9 },
    ],
  "add-two-numbers": [
      { input: { l1: [1], l2: [9,9] }, expectedOutput: [0,0,1] },
      { input: { l1: [5], l2: [5] }, expectedOutput: [0,1] },
    ],
  "pow-x-n": [
      { input: { x: 1.0, n: -2147483648 }, expectedOutput: 1.0 },
      { input: { x: 0.0, n: 0 }, expectedOutput: 1.0 },
    ],
  "4sum": [
      { input: { nums: [-2,-1,-1,1,1,2,2], target: 0 }, expectedOutput: [[-2,-1,1,2],[-1,-1,1,1]] },
    ],
  "remove-duplicates-sorted-array-ii": [
      { input: { nums: [1] }, expectedOutput: 1 },
      { input: { nums: [1,1,1,1] }, expectedOutput: 2 },
    ],
  "valid-triangle-number": [
      { input: { nums: [1,1,1] }, expectedOutput: 1 },
      { input: { nums: [3,24,4,380] }, expectedOutput: 1 },
    ],
  "implement-stack-using-queues": [
      { input: { ops: ["push","push","push","pop","top","empty"], vals: [[1],[2],[3],[],[],[]] }, expectedOutput: [null,null,null,3,2,false] },
    ],
  "design-hashmap": [
      { input: { ops: ["put","put","put","get","remove","get"], vals: [[0,0],[1,1],[0,2],[0],[0],[0]] }, expectedOutput: [null,null,null,2,null,-1] },
    ],
  "design-circular-queue": [
      { input: { k: 1, ops: ["enQueue","isFull","deQueue","isEmpty"], vals: [[5],[],[],[]] }, expectedOutput: [true,true,true,true] },
    ],
  "find-median-from-data-stream": [
      { input: { ops: ["addNum","findMedian","addNum","findMedian","addNum","findMedian"], vals: [[6],[],[10],[],[2],[]] }, expectedOutput: [null,6.0,null,8.0,null,6.0] },
    ],
  "time-based-key-value-store": [
      { input: { ops: ["set","get","get"], vals: [["love","high",10],["love",5],["love",10]] }, expectedOutput: [null,"","high"] },
    ],
  "maximum-frequency-stack": [
      { input: { ops: ["push","push","push","pop","pop"], vals: [[1],[1],[2],[],[]] }, expectedOutput: [null,null,null,1,1] },
    ],
  "sliding-window-maximum": [
      { input: { nums: [9,11], k: 2 }, expectedOutput: [11] },
      { input: { nums: [4,3,11,2], k: 2 }, expectedOutput: [4,11,11] },
    ],
  "merge-k-sorted-lists": [
      { input: { lists: [[1],[2],[3]] }, expectedOutput: [1,2,3] },
      { input: { lists: [[-1,5,11],[-2,10]] }, expectedOutput: [-2,-1,5,10,11] },
    ],
  "reverse-nodes-in-k-group": [
      { input: { head: [1], k: 1 }, expectedOutput: [1] },
      { input: { head: [1,2], k: 2 }, expectedOutput: [2,1] },
    ],
  "longest-valid-parentheses": [
      { input: { s: "()()" }, expectedOutput: 4 },
      { input: { s: "(((" }, expectedOutput: 0 },
    ],
  "jump-game": [
      { input: { nums: [1,0] }, expectedOutput: true },
      { input: { nums: [0,2,3] }, expectedOutput: false },
    ],
  "gas-station": [
      { input: { gas: [1,2,3,4,5], cost: [1,2,3,4,5] }, expectedOutput: 0 },
      { input: { gas: [3,1,1], cost: [1,2,2] }, expectedOutput: 0 },
    ],
  "task-scheduler": [
      { input: { tasks: ["A"], n: 1 }, expectedOutput: 1 },
      { input: { tasks: ["A","A","A","B","B","C"], n: 2 }, expectedOutput: 7 },
    ],
  "kth-smallest-element-in-bst": [
      { input: { root: [2,1,3], k: 2 }, expectedOutput: 2 },
      { input: { root: [5,3,6,2,4], k: 4 }, expectedOutput: 5 },
    ],
  "path-sum-ii": [
      { input: { root: [1,2], targetSum: 1 }, expectedOutput: [] },
      { input: { root: [1,2], targetSum: 3 }, expectedOutput: [[1,2]] },
    ],
  "maximum-width-of-binary-tree": [
      { input: { root: [1] }, expectedOutput: 1 },
      { input: { root: [1,2,3] }, expectedOutput: 2 },
    ],
  "number-of-ways-k-steps": [
      { input: { startPos: 0, endPos: 0, k: 2 }, expectedOutput: 2 },
      { input: { startPos: 1000, endPos: 1, k: 999 }, expectedOutput: 1 },
    ],
  "longest-common-subsequence": [
      { input: { text1: "bl", text2: "yby" }, expectedOutput: 1 },
      { input: { text1: "oxcpqrsvwf", text2: "shmtulqrypy" }, expectedOutput: 2 },
    ],
  "maximum-product-subarray": [
      { input: { nums: [-2,3,-4] }, expectedOutput: 24 },
      { input: { nums: [0,2] }, expectedOutput: 2 },
    ],
  "min-cost-climbing-stairs": [
      { input: { cost: [1,2,3] }, expectedOutput: 2 },
      { input: { cost: [10,15] }, expectedOutput: 10 },
    ],
  "triangle": [
      { input: { triangle: [[-1],[2,3],[1,-1,-3]] }, expectedOutput: -1 },
    ],
  "perfect-squares": [
      { input: { n: 4 }, expectedOutput: 1 },
      { input: { n: 7 }, expectedOutput: 4 },
    ],
  "graph-valid-tree": [
      { input: { n: 2, edges: [] }, expectedOutput: false },
      { input: { n: 3, edges: [[0,1],[1,2],[0,2]] }, expectedOutput: false },
    ],
  "accounts-merge": [
      { input: { accounts: [["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co"],["Ethan","Ethan5@m.co"]] }, expectedOutput: [["Gabe","Gabe0@m.co","Gabe1@m.co","Gabe3@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co"],["Ethan","Ethan5@m.co"]] },
    ],
  "keys-and-rooms": [
      { input: { rooms: [[2,3],[],[2],[1,3]] }, expectedOutput: false },
    ],
  "find-the-town-judge": [
      { input: { n: 1, trust: [] }, expectedOutput: 1 },
      { input: { n: 4, trust: [[1,3],[1,4],[2,3],[2,4],[4,3]] }, expectedOutput: 3 },
    ],
  "all-paths-source-to-target": [
      { input: { graph: [[1],[]] }, expectedOutput: [[0,1]] },
      { input: { graph: [[1,2,3],[3],[3],[]] }, expectedOutput: [[0,1,3],[0,2,3],[0,3]] },
    ],
  "combination-sum-ii": [
      { input: { candidates: [1,1,1,1], target: 2 }, expectedOutput: [[1,1]] },
      { input: { candidates: [3,1,3,5,1,1], target: 8 }, expectedOutput: [[1,1,1,5],[1,3,3],[3,5]] },
    ],
  "word-search": [
      { input: { board: [["a"]], word: "a" }, expectedOutput: true },
      { input: { board: [["a","b"],["c","d"]], word: "abdc" }, expectedOutput: true },
    ],
  "palindrome-partitioning": [
      { input: { s: "aba" }, expectedOutput: [["a","b","a"],["aba"]] },
      { input: { s: "aa" }, expectedOutput: [["a","a"],["aa"]] },
    ],
  "n-queens": [
      { input: { n: 5 }, expectedOutput: [["Q....","..Q..","....Q",".Q...","...Q."],["Q....","...Q.",".Q...","....Q","..Q.."],["..Q..","Q....","...Q.",".Q...","....Q"],["..Q..","....Q",".Q...","...Q.","Q...."],["...Q.","Q....","..Q..","....Q",".Q..."],["...Q.",".Q...","....Q","..Q..","Q...."],["....Q",".Q...","...Q.","Q....","..Q.."],["....Q","..Q..","Q....","...Q.",".Q..."]] },
    ],
  "koko-eating-bananas": [
      { input: { piles: [1,1,1,999999999], h: 10 }, expectedOutput: 142857143 },
      { input: { piles: [312884470], h: 312884469 }, expectedOutput: 2 },
    ],
  "search-in-rotated-sorted-array-ii": [
      { input: { nums: [1,0,1,1,1], target: 0 }, expectedOutput: true },
      { input: { nums: [3,1,1], target: 3 }, expectedOutput: true },
    ],
  "find-k-closest-elements": [
      { input: { arr: [1,2,3,4,5], k: 4, x: 100 }, expectedOutput: [2,3,4,5] },
      { input: { arr: [0,0,1,2,3,3,4,7,7,8], k: 3, x: 5 }, expectedOutput: [3,3,4] },
    ],
  "median-of-two-sorted-arrays": [
      { input: { nums1: [], nums2: [1] }, expectedOutput: 1.0 },
      { input: { nums1: [2], nums2: [] }, expectedOutput: 2.0 },
    ],
  "subarray-sum-equals-k": [
      { input: { nums: [-1,-1,1], k: 0 }, expectedOutput: 1 },
      { input: { nums: [1,2,1,2,1], k: 3 }, expectedOutput: 4 },
    ],
  "contiguous-array": [
      { input: { nums: [0,0] }, expectedOutput: 0 },
      { input: { nums: [0,1,0,1] }, expectedOutput: 4 },
    ],
  "4sum-ii": [
      { input: { nums1: [-1,1], nums2: [-1,1], nums3: [-1,1], nums4: [-1,1] }, expectedOutput: 6 },
    ],
  "find-k-pairs-with-smallest-sums": [
      { input: { nums1: [1,2], nums2: [3], k: 3 }, expectedOutput: [[1,3],[2,3]] },
    ],
  "ugly-number-ii": [
      { input: { n: 15 }, expectedOutput: 24 },
      { input: { n: 1690 }, expectedOutput: 2123366400 },
    ],
  "ipo": [
      { input: { k: 1, w: 0, profits: [1,2,3], capital: [1,1,2] }, expectedOutput: 0 },
      { input: { k: 11, w: 11, profits: [1,2,3], capital: [11,12,13] }, expectedOutput: 17 },
    ],
  "single-thread-cpu": [
      { input: { tasks: [[1,1],[2,2],[4,4]] }, expectedOutput: [0,1,2] },
    ],
  "reorganize-string": [
      { input: { s: "vvvlo" }, expectedOutput: "vlvov" },
      { input: { s: "aabc" }, expectedOutput: "abac" },
    ],
  "implement-trie-prefix-tree": [
      { input: { ops: ["insert","insert","search","startsWith"], vals: [["abc"],["ab"],["abc"],["ab"]] }, expectedOutput: [null,null,true,true] },
    ],
  "add-and-search-word": [
      { input: { ops: ["addWord","search","search"], vals: [["a"],["."],["a"]] }, expectedOutput: [null,true,true] },
    ],
  "longest-word-in-dictionary": [
      { input: { words: ["yo","ew","fc","zrc","yodn","fcm","qm","qmo","fcmz","z","ewq","yod","ewqz","y"] }, expectedOutput: "yodn" },
    ],
  "replace-words": [
      { input: { dictionary: ["e","k","c","harqp","h","gsafc","vn","lqp","soy","mr","x","iitgm","sb","oo","spTrip","dv"], sentence: "the cattle was rattled by the battery" }, expectedOutput: "the cattle was rattled by the battery" },
    ],
  "isomorphic-strings": [
      { input: { s: "badc", t: "baba" }, expectedOutput: false },
      { input: { s: "ab", t: "aa" }, expectedOutput: false },
    ],
  "ransom-note": [
      { input: { ransomNote: "fihjjjjei", magazine: "hjibagacbhadfaefdjaeaebgi" }, expectedOutput: true },
    ],
  "find-all-anagrams-in-string": [
      { input: { s: "baa", p: "aa" }, expectedOutput: [1] },
      { input: { s: "aaacb", p: "acb" }, expectedOutput: [2] },
    ],
  "longest-repeating-character-replacement": [
      { input: { s: "ABBB", k: 2 }, expectedOutput: 4 },
      { input: { s: "ABCDE", k: 1 }, expectedOutput: 2 },
    ],
  "permutation-in-string": [
      { input: { s1: "abc", s2: "lecabee" }, expectedOutput: true },
      { input: { s1: "hello", s2: "ooolleoooleh" }, expectedOutput: false },
    ],
  "house-robber-ii": [
      { input: { nums: [1] }, expectedOutput: 1 },
      { input: { nums: [200,3,140,20,10] }, expectedOutput: 340 },
    ],
  "counting-bits": [
      { input: { n: 1 }, expectedOutput: [0,1] },
      { input: { n: 8 }, expectedOutput: [0,1,1,2,1,2,2,3,1] },
    ],
  "sum-of-two-integers": [
      { input: { a: -12, b: -8 }, expectedOutput: -20 },
      { input: { a: 0, b: 0 }, expectedOutput: 0 },
    ],
  "missing-number": [
      { input: { nums: [0] }, expectedOutput: 1 },
      { input: { nums: [1] }, expectedOutput: 0 },
    ],
  "reverse-bits": [
      { input: { n: 0 }, expectedOutput: 0 },
      { input: { n: 1 }, expectedOutput: 2147483648 },
    ],
  "single-number-ii": [
      { input: { nums: [-2,-2,1,-2] }, expectedOutput: 1 },
      { input: { nums: [43,16,45,89,45,-2147483648,45,16,16,43,43,89,89] }, expectedOutput: -2147483648 },
    ],
  "car-fleet": [
      { input: { target: 10, position: [6,8], speed: [3,2] }, expectedOutput: 2 },
      { input: { target: 10, position: [0,4,2], speed: [2,1,3] }, expectedOutput: 1 },
    ],
  "largest-rectangle-in-histogram": [
      { input: { heights: [0,9] }, expectedOutput: 9 },
      { input: { heights: [6,7,5,2,4,5,9,3] }, expectedOutput: 16 },
    ],
  "maximal-rectangle": [
      { input: { matrix: [["1","1"],["1","1"]] }, expectedOutput: 4 },
      { input: { matrix: [["1","0"],["0","1"]] }, expectedOutput: 1 },
    ],
  "evaluate-reverse-polish-notation": [
      { input: { tokens: ["3","4","+","2","*","7","/"] }, expectedOutput: 2 },
      { input: { tokens: ["-2","3","+"] }, expectedOutput: 1 },
    ],
  "implement-queue-using-stacks": [
      { input: { ops: ["push","push","push","pop","peek","pop","empty"], vals: [[1],[2],[3],[],[],[],[]] }, expectedOutput: [null,null,null,1,2,2,false] },
    ],
  "minimum-stack": [
      { input: { ops: ["push","push","getMin","pop","getMin"], vals: [[2],[1],[],[],[]] }, expectedOutput: [null,null,1,null,2] },
    ],
  "basic-calculator-ii": [
      { input: { s: "14-3/2" }, expectedOutput: 13 },
      { input: { s: "1*2-3/4+5*6-7*8+9/10" }, expectedOutput: -24 },
    ],
  "asteroid-collision": [
      { input: { asteroids: [-2,-1,1,2] }, expectedOutput: [-2,-1,1,2] },
      { input: { asteroids: [1,-2,-2,-2] }, expectedOutput: [-2,-2,-2] },
    ],
  "remove-k-digits": [
      { input: { num: "9", k: 1 }, expectedOutput: "0" },
      { input: { num: "112", k: 1 }, expectedOutput: "11" },
    ],
  "wildcard-matching": [
      { input: { s: "adceb", p: "*a*b" }, expectedOutput: true },
      { input: { s: "acdcb", p: "a*c?b" }, expectedOutput: false },
    ],
  "regular-expression-matching": [
      { input: { s: "aab", p: "c*a*b" }, expectedOutput: true },
      { input: { s: "mississippi", p: "mis*is*p*." }, expectedOutput: false },
    ],
  "best-time-to-buy-sell-stock-iii": [
      { input: { prices: [1] }, expectedOutput: 0 },
      { input: { prices: [1,2,4,2,5,7,2,4,9,0,9] }, expectedOutput: 15 },
    ],
  "maximal-square": [
      { input: { matrix: [["1"]] }, expectedOutput: 1 },
      { input: { matrix: [["1","1","1","1"],["1","1","1","1"],["1","1","1","1"]] }, expectedOutput: 9 },
    ],
  "candy": [
      { input: { ratings: [1,3,2,2,1] }, expectedOutput: 7 },
      { input: { ratings: [0,1,2,5,3,2,7] }, expectedOutput: 15 },
    ],
  "partition-labels": [
      { input: { s: "abcde" }, expectedOutput: [1,1,1,1,1] },
      { input: { s: "eaaaabaaec" }, expectedOutput: [9,1] },
    ],
  "boats-to-save-people": [
      { input: { people: [2,2], limit: 6 }, expectedOutput: 1 },
      { input: { people: [5,1,4,2], limit: 6 }, expectedOutput: 2 },
    ],
  "queue-reconstruction-by-height": [
      { input: { people: [[7,0],[4,4]] }, expectedOutput: [[7,0],[4,4]] },
    ],
  "wiggle-subsequence": [
      { input: { nums: [0,0] }, expectedOutput: 1 },
      { input: { nums: [3,3,3,2,5] }, expectedOutput: 3 },
    ],
  "minimum-arrows-burst-balloons": [
      { input: { points: [[1,2]] }, expectedOutput: 1 },
      { input: { points: [[-2147483646,-2147483645],[2147483646,2147483647]] }, expectedOutput: 2 },
    ],
  "alien-dictionary": [
      { input: { words: ["z","z"] }, expectedOutput: "z" },
      { input: { words: ["ab","adc"] }, expectedOutput: "abdc" },
    ],
  "network-delay-time": [
      { input: { times: [[1,2,1],[2,3,2],[1,3,4]], n: 3, k: 1 }, expectedOutput: 3 },
      { input: { times: [[1,2,1],[2,3,7],[1,3,4],[2,1,2]], n: 3, k: 2 }, expectedOutput: 6 },
    ],
  "walls-and-gates": [
      { input: { rooms: [[0,-1],[2147483647,2147483647]] }, expectedOutput: [[0,-1],[1,2]] },
    ],
  "swim-in-rising-water": [
      { input: { grid: [[0]] }, expectedOutput: 0 },
      { input: { grid: [[3,2],[0,1]] }, expectedOutput: 3 },
    ],
  "find-the-duplicate-number": [
      { input: { nums: [1,1] }, expectedOutput: 1 },
      { input: { nums: [2,2,2,2,2] }, expectedOutput: 2 },
    ],
  "minimum-interval-to-include-each-query": [
      { input: { intervals: [[1,100]], queries: [50] }, expectedOutput: [100] },
    ],
  "3sum-closest": [
      { input: { nums: [1,2,5,10,11], target: 12 }, expectedOutput: 13 },
      { input: { nums: [-1,2,1,-4], target: 0 }, expectedOutput: -1 },
    ],

};

export default hiddentestcases;