<script lang="ts">
    import { page } from "$app/stores";
    import type { Mod } from "@lib/Mod";
    import { NxmMod } from "@lib/adapter/Nexusmods";
    import { Database } from "@lib/db";
    import NexusModEditView from "./components/NexusModEditView.svelte";
    import { writable, type Writable } from "svelte/store";
    import { getContext } from "svelte";
    import type { ModPlan } from "@lib/Plan";
    import { GenericWebMod } from "@lib/adapter/GenericWebMod";
    import GenericWebModEditView from "./components/GenericWebModEditView.svelte";

	let mod: Writable<Mod>;
	
	$: mod       = writable($page.data.mod);
</script>

<a href="/">Home</a>

{#if $mod instanceof NxmMod}
	<NexusModEditView mod={mod} />
{:else if $mod instanceof GenericWebMod}
	<GenericWebModEditView mod={mod} />
{:else}
	<h1>Unknown mod type: <pre>{$mod.constructor.name}</pre></h1>
{/if}