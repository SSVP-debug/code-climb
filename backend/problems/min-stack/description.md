Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

Maintain a second 'min stack' alongside the main stack. Every time you push a value, also push the current minimum. When you pop, pop both.

You'll receive an array of operations: ['push', val], ['pop'], ['top'], ['getMin']. Return an array of results for top and getMin calls.