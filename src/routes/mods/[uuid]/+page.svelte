<script lang="ts">
    import { page } from "$app/stores";
    import { NxmMod } from "$lib/adapter/Nexusmods";
    import { Database } from "$lib/db_json";
    import { get, writable, type Writable } from "svelte/store";
    import { getContext } from "svelte";
    import type { ModPlan } from "$lib/Plan";
    import { GenericWebMod } from "$lib/adapter/GenericWebMod";
    import type { __DEPRECATED__Mod, ModLink } from "$lib/Mod";
    import { MakeModLinkFromUrl } from "$lib/ModHelper";
    import SvelteMarkdown from "svelte-markdown";
	import Icon from '@iconify/svelte';

	let mod: Writable<__DEPRECATED__Mod> = writable( new GenericWebMod( 'null_mod' ) );
	
	$: {
		Database.get<__DEPRECATED__Mod>( $page.params.uuid ).then( ( m ) => {
			mod.set( m );
		})
	}

	let requirement_to_add: string;
	let incompatibility_to_add: string;
	let show_note_edit: boolean = false;
	let plan_uuid = localStorage.getItem( "active_plan_uuid" );
	let edit_description = false;

	async function save_changes()
	{
		await Database.put( get(mod) );
	}

	async function refresh()
	{
		mod.update( async ( m ) => {
			if( m instanceof NxmMod )
			{
				await m.reload();
				
				// These are not editable, so safe to replace
				m.title           = m.source_info.title;
				m.description     = m.source_info.description;
				m.cover_image_uri = m.source_info.image;
			}
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

	async function openInWebBrowser( url: string )
	{
		await open( url );
	}
</script>


<nav>
	<a href="/">
		<Icon icon="ic:home-outline" />
		<span>Home</span>
	</a>
	{#if plan_uuid !== null }
		<a href="/plan/{plan_uuid}">
			<Icon icon="ic:note-outline" />
			<span>Back to Plan</span>
		</a>
	{/if}
	<button on:click={save_changes}>
		<Icon icon="ic:save-outline" />
		<span>Save</span>
	</button>
	<button on:click={refresh}>
		<Icon icon="ic:refresh" />
		<span>Refresh Source</span>
	</button>
</nav>
<article>
	<mod-details>
		<img src={$mod.cover_image_uri} alt='cover'/>
		{#if $mod instanceof NxmMod}
			<header><h1>{$mod.title}</h1></header>
		{:else}
			<header><input bind:value={$mod.title} placeholder="Mod Title"/></header>
		{/if}
		{#if $mod instanceof NxmMod || $mod instanceof GenericWebMod }
			{@const web_mod = $mod }
			<pre>{web_mod.url}</pre>
			<button on:click={ ()=> openInWebBrowser( web_mod.url) }>Open In Browser</button>
		{/if}
		{#if !($mod instanceof NxmMod) && edit_description}
			<button on:click={()=> {
				edit_description = false;
				save_changes();
			}}>Save</button>
			<textarea bind:value={$mod.description} />
		{:else}
			{#if !($mod instanceof NxmMod) }
				<button on:click={()=> {edit_description = true}}>Edit</button>
			{/if}
			<p>{$mod.description}</p>
		{/if}
		<SvelteMarkdown source={$mod?.details ?? "" } />
	</mod-details>
	<requirements>
		<header>
			<h1>Requirements:</h1>
			{#if $mod instanceof NxmMod }
				{@const nxmMod = mod }
				<button on:click={() => {
					nxmMod.update( m => {
						m.resetRequirements();
						return m;
					});
				}}>Reset</button>
			{/if}
		</header>
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
	</requirements>
	<incompatibilities>
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
	</incompatibilities>
	{#if $mod instanceof NxmMod}
		{@const nxmMod = $mod}
		<files>
			<h1>Files:</h1>
			<main-files>
				<h2>Main Files:</h2>
				{#each nxmMod.main_files.values() as file}
					<details class='file'>
						<summary>
							{file.name}
						</summary>
						<SvelteMarkdown source={file.description} />
					</details>
				{/each}
			</main-files>
			{#if (nxmMod.optional_files?.size ?? 0) > 0}
				<optional-files>
					<h2>Optional Files:</h2>
					{#each nxmMod.optional_files?.values() ?? [] as file}
						<details class='file'>
							<summary>
								{file.name}
							</summary>
							<SvelteMarkdown source={file.description} />
						</details>
					{/each}
				</optional-files>
			{/if}
			{#if (nxmMod.old_files?.size ?? 0) > 0}
				<optional-files>
					<h2>Old Files:</h2>
					{#each nxmMod.old_files?.values() ?? [] as file}
						<details class='file'>
							<summary>
								{file.name}
							</summary>
							<SvelteMarkdown source={file.description} />
						</details>
					{/each}
				</optional-files>
			{/if}
		</files>
	{/if}
	<notes>
		<header><h1>Notes:</h1></header>
		{#if show_note_edit }
			<button on:click={ async () => {
				await save_changes();
				show_note_edit = false;
			}}>Save</button>
			<textarea bind:value={$mod.notes} />
		{:else}
			<button on:click={ async () => {
				show_note_edit = true;
			}}>Edit</button>
			<SvelteMarkdown source={$mod.notes ?? ""} />
		{/if}
	</notes>
</article>

<style lang="scss">
	$nav-width: 8em;
	nav {
		position: fixed;
		display:  flex;
		flex-direction: column;

		left:  0;
		width: $nav-width;

		height: 100vh;
		background-color: #222;

		a,
		button {
			border: none;
			background: none;

			color: #DDD;
			text-decoration: none;

			font-size: 0.9rem;
			text-align: left;

			padding:  0.2em 0.2em;
			margin: 0;

			cursor: pointer;

			transition: 
				background-color 150ms ease-in-out,
				color 150ms ease-in-out,
			;
			&:hover {
				background-color: #DDD;
				color: #222;
			}
		}
	}
	article {
		margin-left: $nav-width;
	}
</style>