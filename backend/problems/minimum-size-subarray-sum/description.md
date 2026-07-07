Given a target integer and an array of positive integers nums, return the minimal length of a contiguous subarray whose sum is >= target. If no such subarray exists, return 0.

Expand the window by moving right. When the window sum meets the target, shrink from the left and record the minimum length.