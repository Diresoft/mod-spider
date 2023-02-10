---
related-view: "Mod Planner -> Plan"
---

# Steps to Reproduce
1. Expand a folder to show children
	1. Must have at least 2 children
2. Move a child to the parent
3. Move another child to the parent
4. Observe that the second child will remain in the original location as well as in the new one

# Demonstration
![[groups_bug.gif]]

# Log
```
ModGroupEntry.svelte:79 Drag Misc out of Assets
ModGroupEntry.svelte:114 Drag Misc out of Assets and drop inside Visuals
+layout.svelte:22 onGroupDroppedInside: Drag Misc out of Assets and drop inside Visuals
+layout.svelte:25 Updated: Assets
+layout.svelte:32 Updated: Misc
+layout.svelte:38 Updated: Visuals
ModGroupEntry.svelte:34 Invoked subscribe for Visuals's View'
ModGroupEntry.svelte:34 Invoked subscribe for Misc's View'
```

# Notes
You can see in the log that "Assets" never call's it's subscribe function like it should. When you collapse "Visuals" and then expand, this forces "Assets" to update and the correct list is indeed shown.

I was able to fix this by **NOT** passing a writable wrapped group to the children.