Given a sorted array of integers and a target value, return the index of the target. If not found, return -1. Your algorithm must run in O(log n) time.

Maintain left and right pointers. Check the midpoint each step — if it equals the target, return mid. If target is less, search left half. Otherwise search right half.