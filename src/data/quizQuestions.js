/**
 * quizQuestions.js — Daily Quick Quiz question bank
 *
 * Static, client-only question bank for the "Daily Quick Quiz" shown right after
 * login (see docs/first-session-experience.md). No quiz attempt is persisted
 * server-side — see Plan 001's "Design decisions" for why this is intentionally
 * NOT seeded into MongoDB the way src/data/problems.js is.
 *
 * Fields:
 *   id            — string, unique, stable (never reuse/renumber an id once
 *                   shipped — analytics may eventually key off it)
 *   topic         — must be one of QUIZ_TOPICS
 *   question      — short question text (renders in a compact mobile card)
 *   options       — exactly 4 strings, no duplicates within a question
 *   correctIndex  — index into `options`, in range [0,3]
 *
 * Consumed by src/utils/quizEngine.js (selectDailyQuestions, scoreQuizAttempt).
 */

export const QUIZ_TOPICS = [
  "Arrays",
  "Strings",
  "Sorting",
  "Searching",
  "Time Complexity",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "DBMS",
  "Operating Systems",
  "JavaScript",
  "Python",
];

const quizQuestions = [

  // ── ARRAYS ────────────────────────────────────────────────────────────────

  {
    id: "arrays-001",
    topic: "Arrays",
    question: "What is the time complexity of accessing an element by index in an array?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 0,
  },
  {
    id: "arrays-002",
    topic: "Arrays",
    question: "What is the time complexity of inserting an element at the beginning of an array?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 1,
  },
  {
    id: "arrays-003",
    topic: "Arrays",
    question: "What is the time complexity of searching for an element in an unsorted array?",
    options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
    correctIndex: 1,
  },
  {
    id: "arrays-004",
    topic: "Arrays",
    question: "Which data structure stores elements in contiguous memory locations?",
    options: ["Linked List", "Array", "Tree", "Graph"],
    correctIndex: 1,
  },
  {
    id: "arrays-005",
    topic: "Arrays",
    question: "What is the index of the first element in a zero-indexed array?",
    options: ["1", "0", "-1", "It is undefined"],
    correctIndex: 1,
  },
  {
    id: "arrays-006",
    topic: "Arrays",
    question: "The classic Two Sum problem is most efficiently solved using which auxiliary structure?",
    options: ["Stack", "Hash Map", "Queue", "Tree"],
    correctIndex: 1,
  },
  {
    id: "arrays-007",
    topic: "Arrays",
    question: "What is the space complexity of reversing an array in place?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 0,
  },
  {
    id: "arrays-008",
    topic: "Arrays",
    question: "Which technique uses two pointers moving toward each other to solve sorted-array problems?",
    options: ["Sliding window", "Two pointer", "Binary search", "Recursion"],
    correctIndex: 1,
  },

  // ── STRINGS ───────────────────────────────────────────────────────────────

  {
    id: "strings-001",
    topic: "Strings",
    question: "What is the time complexity of checking if a string is a palindrome using two pointers?",
    options: ["O(1)", "O(n)", "O(n^2)", "O(log n)"],
    correctIndex: 1,
  },
  {
    id: "strings-002",
    topic: "Strings",
    question: "Which data structure is commonly used to check whether two strings are anagrams efficiently?",
    options: ["Stack", "Hash Map", "Queue", "Tree"],
    correctIndex: 1,
  },
  {
    id: "strings-003",
    topic: "Strings",
    question: "What does string immutability mean in languages like Python and Java?",
    options: [
      "Strings can be changed in place",
      "Strings cannot be modified after creation",
      "Strings are always numeric",
      "Strings must have a fixed length",
    ],
    correctIndex: 1,
  },
  {
    id: "strings-004",
    topic: "Strings",
    question: "Which algorithm is commonly used for efficient substring search?",
    options: ["Bubble Sort", "KMP Algorithm", "Binary Search", "Dijkstra's Algorithm"],
    correctIndex: 1,
  },
  {
    id: "strings-005",
    topic: "Strings",
    question: "What is the time complexity of building a string by repeated naive concatenation in a loop of n steps?",
    options: ["O(1)", "O(n)", "O(n^2)", "O(log n)"],
    correctIndex: 2,
  },
  {
    id: "strings-006",
    topic: "Strings",
    question: "Which approach efficiently finds the longest substring without repeating characters?",
    options: ["Brute force", "Sliding window", "Sorting", "Recursion only"],
    correctIndex: 1,
  },
  {
    id: "strings-007",
    topic: "Strings",
    question: "What is a common way to reverse a string in O(n) time?",
    options: ["Two-pointer swap", "Binary search", "Merge sort", "Hashing"],
    correctIndex: 0,
  },
  {
    id: "strings-008",
    topic: "Strings",
    question: "Which data structure is well suited for prefix-based string searches like autocomplete?",
    options: ["Trie", "Stack", "Queue", "Heap"],
    correctIndex: 0,
  },

  // ── SORTING ───────────────────────────────────────────────────────────────

  {
    id: "sorting-001",
    topic: "Sorting",
    question: "What is the average-case time complexity of quicksort?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    correctIndex: 1,
  },
  {
    id: "sorting-002",
    topic: "Sorting",
    question: "What is the worst-case time complexity of quicksort?",
    options: ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
    correctIndex: 1,
  },
  {
    id: "sorting-003",
    topic: "Sorting",
    question: "Which sorting algorithm is stable and guarantees O(n log n) time in all cases?",
    options: ["Quicksort", "Merge Sort", "Selection Sort", "Bubble Sort"],
    correctIndex: 1,
  },
  {
    id: "sorting-004",
    topic: "Sorting",
    question: "What is the worst-case time complexity of bubble sort?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(1)"],
    correctIndex: 2,
  },
  {
    id: "sorting-005",
    topic: "Sorting",
    question: "Which sorting algorithm works by repeatedly picking the minimum remaining element?",
    options: ["Selection Sort", "Merge Sort", "Quick Sort", "Radix Sort"],
    correctIndex: 0,
  },
  {
    id: "sorting-006",
    topic: "Sorting",
    question: "What is the space complexity of standard merge sort?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 1,
  },
  {
    id: "sorting-007",
    topic: "Sorting",
    question: "Which sorting algorithm performs best on data that is already nearly sorted?",
    options: ["Quicksort", "Insertion Sort", "Heap Sort", "Merge Sort"],
    correctIndex: 1,
  },
  {
    id: "sorting-008",
    topic: "Sorting",
    question: "What is the time complexity of heap sort?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    correctIndex: 1,
  },

  // ── SEARCHING ─────────────────────────────────────────────────────────────

  {
    id: "searching-001",
    topic: "Searching",
    question: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correctIndex: 1,
  },
  {
    id: "searching-002",
    topic: "Searching",
    question: "Binary search requires the input array to be:",
    options: ["Sorted", "Unsorted", "Circular", "Reversed only"],
    correctIndex: 0,
  },
  {
    id: "searching-003",
    topic: "Searching",
    question: "What is the time complexity of linear search?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctIndex: 2,
  },
  {
    id: "searching-004",
    topic: "Searching",
    question: "Which search technique repeatedly divides the search space in half?",
    options: ["Linear Search", "Binary Search", "Jump Search", "DFS"],
    correctIndex: 1,
  },
  {
    id: "searching-005",
    topic: "Searching",
    question: "What is the time complexity of finding an element in a balanced binary search tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
    correctIndex: 1,
  },
  {
    id: "searching-006",
    topic: "Searching",
    question: "Ternary search divides the array into how many parts each step?",
    options: ["Two", "Three", "Four", "One"],
    correctIndex: 1,
  },
  {
    id: "searching-007",
    topic: "Searching",
    question: "What is the best-case time complexity of binary search?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctIndex: 0,
  },
  {
    id: "searching-008",
    topic: "Searching",
    question: "Which search algorithm uses value estimation and works well on a uniformly distributed sorted array?",
    options: ["Interpolation Search", "Bubble Search", "Depth First Search", "Linear Search"],
    correctIndex: 0,
  },

  // ── TIME COMPLEXITY ───────────────────────────────────────────────────────

  {
    id: "time-complexity-001",
    topic: "Time Complexity",
    question: "What does Big O notation describe?",
    options: ["The exact runtime in seconds", "The upper-bound growth rate", "A memory address", "Compilation time"],
    correctIndex: 1,
  },
  {
    id: "time-complexity-002",
    topic: "Time Complexity",
    question: "What is the time complexity of two nested loops, each running n times?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(1)"],
    correctIndex: 2,
  },
  {
    id: "time-complexity-003",
    topic: "Time Complexity",
    question: "Which of these complexities grows the fastest as n increases?",
    options: ["O(log n)", "O(n)", "O(n^2)", "O(2^n)"],
    correctIndex: 3,
  },
  {
    id: "time-complexity-004",
    topic: "Time Complexity",
    question: "What is the average time complexity of accessing an element in a hash map?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 0,
  },
  {
    id: "time-complexity-005",
    topic: "Time Complexity",
    question: "What is the space complexity of an algorithm that uses a fixed number of variables regardless of input size?",
    options: ["O(n)", "O(1)", "O(log n)", "O(n^2)"],
    correctIndex: 1,
  },
  {
    id: "time-complexity-006",
    topic: "Time Complexity",
    question: "Which notation describes a tight bound (both upper and lower) on an algorithm's growth?",
    options: ["Big O", "Big Omega", "Big Theta", "Little o"],
    correctIndex: 2,
  },
  {
    id: "time-complexity-007",
    topic: "Time Complexity",
    question: "What is the time complexity of computing Fibonacci numbers with naive recursion (no memoization)?",
    options: ["O(n)", "O(log n)", "O(2^n)", "O(n^2)"],
    correctIndex: 2,
  },
  {
    id: "time-complexity-008",
    topic: "Time Complexity",
    question: "For large inputs, which is generally faster: O(n log n) or O(n^2)?",
    options: ["O(n^2)", "O(n log n)", "They are always equal", "It depends on the language"],
    correctIndex: 1,
  },

  // ── LINKED LIST ───────────────────────────────────────────────────────────

  {
    id: "linked-list-001",
    topic: "Linked List",
    question: "What is the time complexity of inserting a node at the head of a singly linked list?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 0,
  },
  {
    id: "linked-list-002",
    topic: "Linked List",
    question: "What is the time complexity of accessing the k-th element of a singly linked list?",
    options: ["O(1)", "O(n)", "O(log n)", "O(k^2)"],
    correctIndex: 1,
  },
  {
    id: "linked-list-003",
    topic: "Linked List",
    question: "Which technique is commonly used to detect a cycle in a linked list?",
    options: ["Binary Search", "Floyd's Cycle Detection", "Merge Sort", "DFS"],
    correctIndex: 1,
  },
  {
    id: "linked-list-004",
    topic: "Linked List",
    question: "What does a doubly linked list node contain, in addition to data and a next pointer?",
    options: ["A previous pointer", "A root pointer", "A hash value", "An array index"],
    correctIndex: 0,
  },
  {
    id: "linked-list-005",
    topic: "Linked List",
    question: "What is the time complexity of reversing a singly linked list iteratively?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 1,
  },
  {
    id: "linked-list-006",
    topic: "Linked List",
    question: "In a circular linked list, what does the last node point to?",
    options: ["Null", "The head node", "Itself", "Nothing — it has no next pointer"],
    correctIndex: 1,
  },
  {
    id: "linked-list-007",
    topic: "Linked List",
    question: "What is a key disadvantage of a linked list compared to an array?",
    options: ["No random access", "It cannot store data", "It always has a fixed size", "Insertion at the head is slower"],
    correctIndex: 0,
  },
  {
    id: "linked-list-008",
    topic: "Linked List",
    question: "Which pointer technique finds the middle of a linked list in a single pass?",
    options: ["Two pointer (slow/fast)", "Binary search", "Hashing", "Recursion only"],
    correctIndex: 0,
  },

  // ── STACK ─────────────────────────────────────────────────────────────────

  {
    id: "stack-001",
    topic: "Stack",
    question: "Which ordering principle does a stack follow?",
    options: ["FIFO", "LIFO", "Random", "Priority based"],
    correctIndex: 1,
  },
  {
    id: "stack-002",
    topic: "Stack",
    question: "Which operation removes the top element of a stack?",
    options: ["Push", "Pop", "Peek", "Enqueue"],
    correctIndex: 1,
  },
  {
    id: "stack-003",
    topic: "Stack",
    question: "What is the time complexity of push and pop on an array-based stack?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 0,
  },
  {
    id: "stack-004",
    topic: "Stack",
    question: "Which data structure is commonly used to check for balanced parentheses in an expression?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    correctIndex: 1,
  },
  {
    id: "stack-005",
    topic: "Stack",
    question: "What does the \"peek\" operation do on a stack?",
    options: ["Removes the top element", "Returns the top element without removing it", "Adds a new element", "Empties the stack"],
    correctIndex: 1,
  },
  {
    id: "stack-006",
    topic: "Stack",
    question: "Which real-world feature is most analogous to a stack?",
    options: ["A ticket counter queue", "Undo functionality in a text editor", "Round-robin CPU scheduling", "A printer job queue"],
    correctIndex: 1,
  },
  {
    id: "stack-007",
    topic: "Stack",
    question: "Recursive function calls are managed internally using which structure?",
    options: ["A queue", "The call stack", "A heap only", "A linked list only"],
    correctIndex: 1,
  },
  {
    id: "stack-008",
    topic: "Stack",
    question: "What happens when you push onto a full, fixed-size stack?",
    options: ["Stack underflow", "Stack overflow", "Nothing happens", "It automatically resizes"],
    correctIndex: 1,
  },

  // ── QUEUE ─────────────────────────────────────────────────────────────────

  {
    id: "queue-001",
    topic: "Queue",
    question: "Which ordering principle does a queue follow?",
    options: ["LIFO", "FIFO", "Random", "Priority only"],
    correctIndex: 1,
  },
  {
    id: "queue-002",
    topic: "Queue",
    question: "Which operation adds an element to the rear of a queue?",
    options: ["Dequeue", "Enqueue", "Pop", "Peek"],
    correctIndex: 1,
  },
  {
    id: "queue-003",
    topic: "Queue",
    question: "What is the time complexity of enqueue and dequeue on a well-implemented queue?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 0,
  },
  {
    id: "queue-004",
    topic: "Queue",
    question: "Which type of queue allows insertion and deletion from both ends?",
    options: ["Circular Queue", "Deque", "Priority Queue", "Simple Queue"],
    correctIndex: 1,
  },
  {
    id: "queue-005",
    topic: "Queue",
    question: "Which data structure typically implements a priority queue efficiently?",
    options: ["Stack", "Heap", "Linked List", "Array only"],
    correctIndex: 1,
  },
  {
    id: "queue-006",
    topic: "Queue",
    question: "Which graph traversal algorithm commonly uses a queue?",
    options: ["DFS", "BFS", "Inorder Traversal", "Preorder Traversal"],
    correctIndex: 1,
  },
  {
    id: "queue-007",
    topic: "Queue",
    question: "In a circular queue, what happens when the rear index reaches the end of the underlying array?",
    options: ["It stops accepting elements", "It wraps around to the front", "It always throws an error", "It resizes automatically"],
    correctIndex: 1,
  },
  {
    id: "queue-008",
    topic: "Queue",
    question: "Which of these is a common use case for a queue in an operating system?",
    options: ["Undo operations", "CPU task scheduling", "Backtracking", "Expression evaluation"],
    correctIndex: 1,
  },

  // ── TREES ─────────────────────────────────────────────────────────────────

  {
    id: "trees-001",
    topic: "Trees",
    question: "What is the maximum number of children a node can have in a binary tree?",
    options: ["1", "2", "3", "Unlimited"],
    correctIndex: 1,
  },
  {
    id: "trees-002",
    topic: "Trees",
    question: "What is the time complexity of searching in a balanced binary search tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
    correctIndex: 1,
  },
  {
    id: "trees-003",
    topic: "Trees",
    question: "Which traversal visits the left subtree, then the root, then the right subtree?",
    options: ["Preorder", "Inorder", "Postorder", "Level order"],
    correctIndex: 1,
  },
  {
    id: "trees-004",
    topic: "Trees",
    question: "What property must a binary search tree maintain?",
    options: [
      "The left child always equals the parent",
      "Left subtree values are less than the root",
      "All children are placed randomly",
      "The right subtree is always empty",
    ],
    correctIndex: 1,
  },
  {
    id: "trees-005",
    topic: "Trees",
    question: "Which of these is an example of a self-balancing binary search tree?",
    options: ["AVL Tree", "Linked List", "Stack", "Plain Array"],
    correctIndex: 0,
  },
  {
    id: "trees-006",
    topic: "Trees",
    question: "Which traversal retrieves the nodes of a BST in sorted order?",
    options: ["Preorder", "Postorder", "Inorder", "Level order"],
    correctIndex: 2,
  },
  {
    id: "trees-007",
    topic: "Trees",
    question: "What is the approximate height of a balanced binary tree with n nodes?",
    options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
    correctIndex: 1,
  },
  {
    id: "trees-008",
    topic: "Trees",
    question: "Which traversal visits the root node first, before its children?",
    options: ["Inorder", "Preorder", "Postorder", "None of these"],
    correctIndex: 1,
  },

  // ── GRAPHS ────────────────────────────────────────────────────────────────

  {
    id: "graphs-001",
    topic: "Graphs",
    question: "Which algorithm finds the shortest path in a weighted graph with non-negative edges?",
    options: ["DFS", "Dijkstra's Algorithm", "Bubble Sort", "Binary Search"],
    correctIndex: 1,
  },
  {
    id: "graphs-002",
    topic: "Graphs",
    question: "What data structure is typically used to implement BFS traversal?",
    options: ["Stack", "Queue", "Heap only", "Tree only"],
    correctIndex: 1,
  },
  {
    id: "graphs-003",
    topic: "Graphs",
    question: "What data structure is typically used to implement DFS traversal iteratively (without recursion)?",
    options: ["Queue", "Stack", "Priority Queue", "Deque only"],
    correctIndex: 1,
  },
  {
    id: "graphs-004",
    topic: "Graphs",
    question: "Which of these is a common way to represent a graph in memory?",
    options: ["Adjacency Matrix", "Sorted Array", "Binary Tree", "Hash Set only"],
    correctIndex: 0,
  },
  {
    id: "graphs-005",
    topic: "Graphs",
    question: "Topological sort applies to which kind of graph?",
    options: ["Any graph", "Directed Acyclic Graphs", "Undirected graphs only", "Weighted graphs only"],
    correctIndex: 1,
  },
  {
    id: "graphs-006",
    topic: "Graphs",
    question: "Which algorithm can detect a negative weight cycle in a graph?",
    options: ["Dijkstra's Algorithm", "Bellman-Ford Algorithm", "BFS", "Binary Search"],
    correctIndex: 1,
  },
  {
    id: "graphs-007",
    topic: "Graphs",
    question: "What is the time complexity of BFS/DFS on a graph with V vertices and E edges?",
    options: ["O(V)", "O(V + E)", "O(V * E)", "O(E^2)"],
    correctIndex: 1,
  },
  {
    id: "graphs-008",
    topic: "Graphs",
    question: "Which algorithm finds the Minimum Spanning Tree of a graph?",
    options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Binary Search", "KMP Algorithm"],
    correctIndex: 1,
  },

  // ── DYNAMIC PROGRAMMING ───────────────────────────────────────────────────

  {
    id: "dp-001",
    topic: "Dynamic Programming",
    question: "What technique does dynamic programming primarily use to optimize recursive solutions?",
    options: ["Memoization", "Random guessing", "Brute force only", "Sorting"],
    correctIndex: 0,
  },
  {
    id: "dp-002",
    topic: "Dynamic Programming",
    question: "What property must a problem have to be efficiently solved with dynamic programming?",
    options: [
      "Overlapping subproblems and optimal substructure",
      "It must only involve sorting",
      "It must only involve recursion",
      "It must have no repeated subproblems",
    ],
    correctIndex: 0,
  },
  {
    id: "dp-003",
    topic: "Dynamic Programming",
    question: "What is the time complexity of computing the n-th Fibonacci number using memoization?",
    options: ["O(2^n)", "O(n)", "O(n^2)", "O(log n)"],
    correctIndex: 1,
  },
  {
    id: "dp-004",
    topic: "Dynamic Programming",
    question: "Which approach builds a solution from the base case upward, without recursion?",
    options: ["Top-down memoization", "Bottom-up tabulation", "Backtracking", "Greedy approach"],
    correctIndex: 1,
  },
  {
    id: "dp-005",
    topic: "Dynamic Programming",
    question: "The 0/1 Knapsack problem is a classic example of which type of problem?",
    options: ["A sorting problem", "A dynamic programming problem", "A graph traversal problem", "A string matching problem"],
    correctIndex: 1,
  },
  {
    id: "dp-006",
    topic: "Dynamic Programming",
    question: "What is memoization used for in dynamic programming?",
    options: [
      "Storing results of expensive function calls for reuse",
      "Sorting an array",
      "Deleting duplicate results",
      "Compiling code faster",
    ],
    correctIndex: 0,
  },
  {
    id: "dp-007",
    topic: "Dynamic Programming",
    question: "What is the time complexity of the standard Longest Common Subsequence DP solution for strings of length m and n?",
    options: ["O(m + n)", "O(m * n)", "O(m^2 * n^2)", "O(log(m * n))"],
    correctIndex: 1,
  },
  {
    id: "dp-008",
    topic: "Dynamic Programming",
    question: "Which of these is NOT typically solved using dynamic programming?",
    options: ["Longest Common Subsequence", "Coin Change", "Binary search on a sorted static array", "Edit Distance"],
    correctIndex: 2,
  },

  // ── DBMS ──────────────────────────────────────────────────────────────────

  {
    id: "dbms-001",
    topic: "DBMS",
    question: "What does the 'A' in the ACID properties of a database transaction stand for?",
    options: ["Atomicity", "Availability", "Aggregation", "Access"],
    correctIndex: 0,
  },
  {
    id: "dbms-002",
    topic: "DBMS",
    question: "Which normal form eliminates transitive dependency on the primary key?",
    options: ["1NF", "2NF", "3NF", "BCNF only"],
    correctIndex: 2,
  },
  {
    id: "dbms-003",
    topic: "DBMS",
    question: "What is a primary key used for in a relational database table?",
    options: ["Uniquely identify each row", "Sort the table alphabetically", "Encrypt sensitive data", "Compress storage"],
    correctIndex: 0,
  },
  {
    id: "dbms-004",
    topic: "DBMS",
    question: "Which type of join returns only the rows that match in both tables?",
    options: ["Left Join", "Right Join", "Inner Join", "Full Outer Join"],
    correctIndex: 2,
  },
  {
    id: "dbms-005",
    topic: "DBMS",
    question: "What is the main purpose of an index in a database?",
    options: ["Speed up query lookups", "Encrypt stored data", "Delete duplicate rows", "Increase storage size"],
    correctIndex: 0,
  },
  {
    id: "dbms-006",
    topic: "DBMS",
    question: "Which SQL clause is used to filter groups after an aggregation?",
    options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
    correctIndex: 1,
  },
  {
    id: "dbms-007",
    topic: "DBMS",
    question: "What does database normalization primarily aim to reduce?",
    options: ["Query speed", "Data redundancy", "Number of tables", "Number of users"],
    correctIndex: 1,
  },
  {
    id: "dbms-008",
    topic: "DBMS",
    question: "What is a foreign key used for in a relational database?",
    options: ["Encrypting a column", "Referencing a primary key in another table", "Speeding up sorting", "Storing binary data"],
    correctIndex: 1,
  },

  // ── OPERATING SYSTEMS ─────────────────────────────────────────────────────

  {
    id: "os-001",
    topic: "Operating Systems",
    question: "What is the primary purpose of an operating system's process scheduler?",
    options: ["Manage memory allocation", "Decide which process runs next on the CPU", "Compile programs", "Manage file permissions"],
    correctIndex: 1,
  },
  {
    id: "os-002",
    topic: "Operating Systems",
    question: "What is a deadlock in operating systems?",
    options: [
      "A process running forever in a loop",
      "A situation where processes wait on each other indefinitely for resources",
      "A crashed CPU",
      "A memory leak",
    ],
    correctIndex: 1,
  },
  {
    id: "os-003",
    topic: "Operating Systems",
    question: "What does a semaphore help manage in concurrent programming?",
    options: ["File compression", "Access to shared resources", "Network routing", "Disk defragmentation"],
    correctIndex: 1,
  },
  {
    id: "os-004",
    topic: "Operating Systems",
    question: "Which memory management technique divides memory into fixed-size blocks?",
    options: ["Paging", "Caching", "Segmentation only", "Swapping only"],
    correctIndex: 0,
  },
  {
    id: "os-005",
    topic: "Operating Systems",
    question: "What is virtual memory primarily used for?",
    options: [
      "Extending usable memory using disk space",
      "Speeding up the CPU clock",
      "Compressing files",
      "Managing user permissions",
    ],
    correctIndex: 0,
  },
  {
    id: "os-006",
    topic: "Operating Systems",
    question: "What is a thread in the context of an operating system?",
    options: ["A separate program", "The smallest unit of CPU execution within a process", "A type of file", "A network connection"],
    correctIndex: 1,
  },
  {
    id: "os-007",
    topic: "Operating Systems",
    question: "Which scheduling algorithm gives each process a fixed time slice in rotation?",
    options: ["First Come First Serve", "Round Robin", "Shortest Job First", "Priority Scheduling only"],
    correctIndex: 1,
  },
  {
    id: "os-008",
    topic: "Operating Systems",
    question: "What commonly causes thrashing in an operating system?",
    options: ["Too much free memory", "Excessive paging due to insufficient memory", "A fast CPU", "Too many idle processes"],
    correctIndex: 1,
  },

  // ── JAVASCRIPT ────────────────────────────────────────────────────────────

  {
    id: "javascript-001",
    topic: "JavaScript",
    question: "What does '===' check for in JavaScript, compared to '=='?",
    options: ["Only value", "Value and type", "Only type", "Nothing different"],
    correctIndex: 1,
  },
  {
    id: "javascript-002",
    topic: "JavaScript",
    question: "What is a closure in JavaScript?",
    options: [
      "A function bundled with references to its surrounding state",
      "A loop construct",
      "A type of array",
      "A CSS property",
    ],
    correctIndex: 0,
  },
  {
    id: "javascript-003",
    topic: "JavaScript",
    question: "Which keyword declares a block-scoped variable in modern JavaScript?",
    options: ["var", "let", "function", "global"],
    correctIndex: 1,
  },
  {
    id: "javascript-004",
    topic: "JavaScript",
    question: "What does 'this' refer to inside a regular function called as an object's method?",
    options: ["The global object, always", "The object the method was called on", "Undefined, always", "The function itself"],
    correctIndex: 1,
  },
  {
    id: "javascript-005",
    topic: "JavaScript",
    question: "What does typeof null return in JavaScript?",
    options: ["\"null\"", "\"object\"", "\"undefined\"", "\"number\""],
    correctIndex: 1,
  },
  {
    id: "javascript-006",
    topic: "JavaScript",
    question: "Which array method returns a new array with the results of calling a function on every element?",
    options: ["forEach", "map", "filter", "reduce"],
    correctIndex: 1,
  },
  {
    id: "javascript-007",
    topic: "JavaScript",
    question: "What does the JavaScript event loop primarily manage?",
    options: ["Memory allocation", "The order asynchronous callbacks run in", "CSS rendering", "Variable hoisting"],
    correctIndex: 1,
  },
  {
    id: "javascript-008",
    topic: "JavaScript",
    question: "What is a Promise in JavaScript used for?",
    options: ["Synchronous looping", "Representing the eventual completion of an async operation", "Declaring variables", "Styling elements"],
    correctIndex: 1,
  },

  // ── PYTHON ────────────────────────────────────────────────────────────────

  {
    id: "python-001",
    topic: "Python",
    question: "What does type([]) return in Python?",
    options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
    correctIndex: 0,
  },
  {
    id: "python-002",
    topic: "Python",
    question: "Which keyword is used to define a function in Python?",
    options: ["func", "def", "function", "lambda only"],
    correctIndex: 1,
  },
  {
    id: "python-003",
    topic: "Python",
    question: "What does a Python list comprehension do?",
    options: ["Compresses a list", "Creates a new list using a concise expression", "Deletes a list", "Sorts a list in place"],
    correctIndex: 1,
  },
  {
    id: "python-004",
    topic: "Python",
    question: "Which of these correctly describes Python lists and tuples?",
    options: [
      "Lists are mutable, tuples are immutable",
      "Lists are immutable, tuples are mutable",
      "Both are immutable",
      "Both are mutable",
    ],
    correctIndex: 0,
  },
  {
    id: "python-005",
    topic: "Python",
    question: "What does the 'self' parameter represent in a Python instance method?",
    options: ["The class itself", "The instance the method is called on", "A global variable", "A static method"],
    correctIndex: 1,
  },
  {
    id: "python-006",
    topic: "Python",
    question: "Which built-in function returns the number of items in a list?",
    options: ["size()", "len()", "count()", "length()"],
    correctIndex: 1,
  },
  {
    id: "python-007",
    topic: "Python",
    question: "What underlying structure does a Python dictionary use to store key-value pairs?",
    options: ["A hash table", "A linked list", "An array only", "A stack"],
    correctIndex: 0,
  },
  {
    id: "python-008",
    topic: "Python",
    question: "What is the purpose of Python's 'with' statement?",
    options: ["Loop iteration", "Context management (e.g. auto-closing files)", "Raising exceptions", "Defining functions"],
    correctIndex: 1,
  },

];

export default quizQuestions;