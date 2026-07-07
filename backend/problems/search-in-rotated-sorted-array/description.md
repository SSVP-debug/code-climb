A sorted array was rotated at an unknown pivot. Given the rotated array and a target, return the index of the target or -1 if not found. Must run in O(log n).

At each binary search step, one half is always sorted. Determine which half the target falls in.