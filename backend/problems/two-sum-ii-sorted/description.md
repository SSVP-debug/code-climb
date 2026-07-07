Given a 1-indexed sorted array of integers and a target, return the 1-indexed positions [index1, index2] of the two numbers that add up to target.

Because the array is sorted, use two pointers from both ends. If the sum is too large, move right pointer left. If too small, move left pointer right.