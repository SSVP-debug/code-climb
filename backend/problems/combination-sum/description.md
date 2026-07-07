Given an array of distinct positive integers candidates and a target, return the number of unique combinations where chosen numbers sum to target. The same number may be chosen unlimited times.

Backtrack: include the current candidate (reusable) or move to the next. Stop when remaining target is 0 (count it) or goes negative (prune).