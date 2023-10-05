<script lang="ts">
    import type { Mod, ModLink } from "@lib/Mod";
    import { MakeModLinkFromUrl } from "@lib/ModHelper";
    import { NxmModLink, type NxmMod } from "@lib/adapter/Nexusmods";
    import { Database } from "@lib/db";
    import { get, type Writable } from "svelte/store";

	export let mod: Writable<NxmMod>;
	
	let requirement_to_add: string;
	let incompatibility_to_add: string;

	async function save_changes()
	{
		await Database.put( get(mod) );
	}
	async function refresh()
	{
		mod.update( async ( m ) => {
			await m.reload();
			
			// These are not editable, so safe to replace
			m.title           = m.source_info.title;
			m.description     = m.source_info.description;
			m.cover_image_uri = m.source_info.image;

			return m;
		})
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
		<button on:click={refresh}>Refresh Source</button>
	</nav>
	<section>
		<img src={$mod.cover_image_uri} alt='cover'/>
		<header><h1>{$mod.title}</h1></header>
		<pre>{$mod.url}</pre>
		<p>{$mod.description}</p>
	</section>
	<section>
		<header><h1>Requirements:</h1> <button on:click={()=>{ mod.update( m => { m.resetRequirements(); return m; }); }}>Reset</button></header>
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