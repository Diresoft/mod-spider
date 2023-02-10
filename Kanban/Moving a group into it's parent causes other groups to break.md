---
related-view: "Mod Planner -> Plan"
---

# Steps to Reproduce
1. Expand a folder to show children
2. Grab any child and begin dragging it
3. Drop the child on the `Drop Inside` trigger of it's parent folder's parent
	1. i.e. Move it out of it's current folder an into the parent
4. Observe that the groups new siblings are no longer correct
	1. It won't _always_ be the same child which has an issue

# Demonstration
![[group_moving_issue.gif]]

# Notes
It looks to me like it's losing track of which child is which. In this demonstration video, "Assets" appears to be added to the list, while "ENB" becomes the header for what was "Assets" before.

I believe this might be related to the issues surrounding the need for a `key` value when using Svelte's `{#each}` functionality: https://svelte.dev/docs#template-syntax-each
> If a _key_ expression is provided — which must uniquely identify each list item — Svelte will use it to diff the list when data changes, rather than adding or removing items at the end. The key can be any object, but strings and numbers are recommended since they allow identity to persist when the objects themselves change.

Yeah, that looks like it