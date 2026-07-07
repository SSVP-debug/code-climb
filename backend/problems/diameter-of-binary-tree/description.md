Given a binary tree as a level-order array, return the length of the tree's diameter — the longest path between any two nodes.

At each node, the longest path through it = left depth + right depth. Track the maximum as you recurse.