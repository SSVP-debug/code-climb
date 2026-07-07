Given an array representing a linked list and an integer n, remove the nth node from the end of the list and return the modified list.

Advance one pointer n steps ahead, then move both pointers together. When the fast pointer hits the end, the slow pointer is right before the node to remove.