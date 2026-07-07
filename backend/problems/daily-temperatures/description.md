Given an array of daily temperatures, return an array where each element is the number of days you have to wait until a warmer temperature. If no future warmer day exists, put 0.

Use a monotonic decreasing stack of indices. When you find a temperature warmer than the stack top, pop and record the difference in indices.