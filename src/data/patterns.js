import { LayoutGrid, Hash, ArrowLeftRight, AppWindow, Search, Layers, Link, Sprout, Share2, Zap } from "lucide-react";

const patterns = [
  {
    id: "arrays",
    name: "Arrays",
    icon: LayoutGrid,
    difficulty: "Beginner",
    estimatedHours: 3,
    color: "green",
    description: "Master array traversal and manipulation.",
  },

  {
    id: "hash-map",
    name: "Hash Maps",
    icon: Hash,
    difficulty: "Beginner",
    estimatedHours: 2,
    color: "blue",
    description: "Fast lookup and frequency counting.",
  },

  {
    id: "two-pointers",
    name: "Two Pointers",
    icon: ArrowLeftRight,
    difficulty: "Beginner",
    estimatedHours: 2,
    color: "cyan",
    description: "Optimize traversal using two indices.",
  },

  {
    id: "sliding-window",
    name: "Sliding Window",
    icon: AppWindow,
    difficulty: "Intermediate",
    estimatedHours: 3,
    color: "purple",
    description: "Process contiguous ranges efficiently.",
  },

  {
    id: "binary-search",
    name: "Binary Search",
    icon: Search,
    difficulty: "Intermediate",
    estimatedHours: 2,
    color: "orange",
    description: "Search efficiently on ordered data.",
  },

  {
    id: "stack",
    name: "Stack",
    icon: Layers,
    difficulty: "Intermediate",
    estimatedHours: 2,
    color: "red",
    description: "LIFO data structure problems.",
  },

  {
    id: "linked-list",
    name: "Linked List",
    icon: Link,
    difficulty: "Intermediate",
    estimatedHours: 3,
    color: "emerald",
    description: "Pointer manipulation mastery.",
  },

  {
    id: "trees",
    name: "Trees",
    icon: Sprout,
    difficulty: "Intermediate",
    estimatedHours: 5,
    color: "lime",
    description: "DFS, BFS and recursive thinking.",
  },

  {
    id: "graphs",
    name: "Graphs",
    icon: Share2,
    difficulty: "Advanced",
    estimatedHours: 6,
    color: "pink",
    description: "Traversal and graph algorithms.",
  },

  {
    id: "dynamic-programming",
    name: "Dynamic Programming",
    icon: Zap,
    difficulty: "Advanced",
    estimatedHours: 8,
    color: "yellow",
    description: "Break problems into optimal subproblems.",
  },
];

export default patterns;