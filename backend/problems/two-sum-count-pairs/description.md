Given an array of integers nums and a target, return the number of unique index pairs (i, j) where i < j and nums[i] + nums[j] == target.

This is a Code Club original. Instead of returning the first pair, count all of them. Use a hash map tracking counts of seen values — for each number, check if (target - number) has been seen and add its count to the result.