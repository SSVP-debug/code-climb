Given a binary tree as a level-order array, determine if it is a valid BST.

Key insight: pass min/max bounds down the recursion — don't just compare parent and child. Every node in the left subtree must be less than all ancestors, not just its parent.