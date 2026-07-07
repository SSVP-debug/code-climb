Given an integer array nums, move all 0s to the end while maintaining the relative order of the non-zero elements. Do this in-place and return the modified array.

Use a slow pointer that tracks the next position for a non-zero element. Iterate with a fast pointer — whenever you find a non-zero, place it at the slow pointer position.