<script lang="ts">
    import type { Mod, ModLink } from "@lib/Mod";
    import { MakeModLinkFromUrl } from "@lib/ModHelper";
    import type { GenericWebMod } from "@lib/adapter/GenericWebMod";
    import { Database } from "@lib/db";
    import { get, type Writable } from "svelte/store";

	export let mod: Writable<GenericWebMod>;
	
	let requirement_to_add: string;
	let incompatibility_to_add: string;

	async function save_changes()
	{
		await Database.put( get(mod) );
	}

	async function removeRequirement( link: ModLink )
	{
		mod.update( m => {
			m.requirements.delete( link );
			return m;
		})
	}

	async function addRequirement( url: string )
	{
		const link = await MakeModLinkFromUrl( url );
		mod.update( m => {
			m.requirements.add( link );
			return m;
		});
	}
	async function removeIncompatibility( link: ModLink )
	{
		mod.update( m => {
			m.incompatible.delete( link );
			return m;
		});
	}
	async function addIncompatibility( url: string )
	{
		const link = await MakeModLinkFromUrl( url );
		mod.update( m => {
			m.incompatible.add( link );
			return m;
		});
	}
</script>

<article>
	<nav>
		<button on:click={save_changes}>Save</button>
	</nav>
	<section>
		<!-- <img src={$mod.image} alt='cover'/> -->
		<header><h1><input type="text" bind:value={$mod.title}/></h1></header>
		<pre>{$mod.url}</pre>
		<textarea bind:value={$mod.description} />
	</section>
	<section>
		<header><h1>Requirements:</h1></header>
		<ul>
			{#each $mod.requirements as requirement }
				<li>
					<button on:click={()=>removeRequirement(requirement)}>-</button>
					{#await requirement.get() }
						{requirement.ref_uuid}
					{:then mod }
						<a href={`/mods/${mod.uuid}`}>{mod.title}</a>
					{/await}
				</li>
			{/each}
			<li><input type=text bind:value={requirement_to_add} /><button on:click={()=>addRequirement( requirement_to_add )}>+</button></li>
		</ul>
	</section>
	<section>
		<header><h1>Incompatibilities:</h1></header>
		<ul>
			{#each $mod.incompatible ?? [] as incompatible }
				<li>
					<button on:click={()=>removeIncompatibility(incompatible)}>-</button>
					{#await incompatible.get() }
						{incompatible.ref_uuid}
					{:then mod }
						<a href={`/mods/${mod.uuid}`}>{mod.title}</a>
					{/await}
				</li>
			{/each}
			<li><input type=text bind:value={incompatibility_to_add} /><button on:click={()=>addIncompatibility( incompatibility_to_add )}>+</button></li>
		</ul>
	</section>
	<section>
		<header><h1>Notes:</h1></header>
		<textarea bind:value={$mod.notes} />
	</section>
</article>