<!-- https://svelvet.mintlify.app/components/node -->
<script context="module" lang='ts'>
    import type { __DEPRECATED__Mod } from '$lib/Mod';
    import type { ModPlan } from '$lib/Plan';
    import { writable, type Writable } from 'svelte/store';
    import { Node } from 'svelvet';
</script>
<script lang="ts">
    export let mod:  __DEPRECATED__Mod;
    export let plan: ModPlan;
    

</script>

<Node id={mod.uuid} let:grabHandle let:selected>
    <header>{mod.title}</header>
    <section>{mod.description}</section>
</Node>