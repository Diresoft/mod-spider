<script lang='ts'>
    import type { Mod } from "$lib/Mod";
    import { afterUpdate, getContext, onDestroy, onMount } from "svelte";
    import ModRequirement from "./ModRequirement.svelte";
    import { derived, get, writable, type Writable } from "svelte/store";
    import { goto } from "$app/navigation";
    import { slide } from "svelte/transition";
    import { quintInOut, quintOut } from "svelte/easing";
    import SvelteMarkdown from "svelte-markdown";
    import Icon from "@iconify/svelte";
	import { NxmMod, type NxmFile } from "@lib/adapter/Nexusmods";
    import { Database } from "@lib/db";
    import { updated } from "$app/stores";
    import type { Snapshot } from "@sveltejs/kit";
    import type { IncludeMemberKeys, IncludeMembers, StoreType } from "@lib/UtilityTypes";
    import type { ModPlan } from "@lib/Plan";
    import { GenericWebMod } from "@lib/adapter/GenericWebMod";

	// COMPONENT LIFECYCLE

	onMount(async () => {
		onMount_view_state();
	})
	afterUpdate(() => {
		onUnmount_view_state();
	});

	// Component Data and Stores

	export let mod: Mod;
	const plan:         Writable<ModPlan> = getContext<Writable<ModPlan>>( "plan" );

	const requirements: Writable<Mod[]>   = writable( [] );
	$: {
		(async function(){
			let out = [];
			for( const req_link of mod.requirements ) {
				out.push( await req_link.get() );
			}
			requirements.set( out );
		})();
	}

	const mod_files: Writable<Map<string, Map<string, NxmFile>>> = writable( new Map() );
	$: required_by		    = $plan.getModsRequiring        ( mod );
	$: incompatible_with    = $plan.getModsIncompatibleWith ( mod );
	const plan_data_store   = $plan.getDataFor              ( mod );
	const derived_data      = derived( [plan, plan_data_store, requirements], ( [$p, $pd, $reqs] ) => {

		// Mod Requirements
		const skipped_requirements: Mod[] = [];
		const missing_requirements: Mod[] = [];
		for( const req_mod of $reqs )
		{
			if ( $pd.skipped_requirements?.has( req_mod.uuid ) ?? false )
			{
				skipped_requirements.push( req_mod );
			}
			else if ( !$p.has( req_mod.uuid ) ) {
				missing_requirements.push( req_mod );
			}
		}

		// Mod Files
		const mf = new Map();
		if ( mod instanceof NxmMod )
		{
			if ( !mf.has( 'main' ) ) mf.set( 'main', new Map() );
			mod.main_files.forEach( ( f ) => mf.get( 'main' )?.set( f.uuid, f ) )
			
			if ( !mf.has( 'optional' ) ) mf.set( 'optional', new Map() );
			mod.optional_files?.forEach( ( f ) => mf.get( 'optional' )?.set( f.uuid, f ) )
			
			if ( !mf.has( 'old' ) ) mf.set( 'old', new Map() );
			mod.old_files?.forEach( ( f ) => mf.get( 'old' )?.set( f.uuid, f ) )
		}
		if ( !mf.has( 'selected' ) ) mf.set( 'selected', new Map() );

		const selected_file_promises = [];
		for( const uuid of $plan_data_store?.selectedFiles ?? [] )
		{
			// Remove it from the regular list
			mf.get( 'main'     )?.delete( uuid );
			mf.get( 'optional' )?.delete( uuid );
			mf.get( 'old'      )?.delete( uuid );

			// Add it to the selected list
			selected_file_promises.push( Database.get<NxmFile>( uuid ) );
			// mf.get( 'selected' )?.set( uuid, await Database.get( uuid ) )
		}

		//mod_files.set( mf );
		Promise.all( selected_file_promises ).then( files => {
			for( const file of files ) {
				mf.get( 'selected' ).set( file.uuid, file );
			}
			mod_files.set( mf );
		})

		return {
			plan: $p,
			data: $pd,
			skipped_requirements,
			missing_requirements
		}
	})

	async function openInBrowser( url: string ) {
		await open( url );
	}

	function removeMod(){
		plan.update( p => {
			p.remove( mod );
			p.process();
			return p;
		})
	}

	function removeOtherMod( modToRemove: Mod )
	{
		plan.update( p => {
			p.remove( modToRemove );
			p.process();
			return p;
		})
	}
	function addMod( modToAdd: Mod )
	{
		plan.update( p => {
			p.add( modToAdd );
			p.process();
			return p;
		})
	}
	function skipMod( modToSkip: Mod )
	{
		plan.update( p => {
			p.getDataFor( mod ).update( pd => {
				pd.skipped_requirements.add( modToSkip.uuid );
				return pd;
			})

			return p;
		})
	}
	function unskipMod( modToUnskip: Mod )
	{
		plan.update( p => {
			p.getDataFor( mod ).update( pd => {
				pd.skipped_requirements.delete( modToUnskip.uuid );
				return pd;
			})

			return p;
		})
	}

	function addModFileToPlan( file: NxmFile )
	{
		mod_files.update( mf => {
			const selected = mf.get( 'selected' ) ?? new Map();
			selected.set( file.uuid, file );
			mf.set( 'selected', selected );

			plan_data_store.update( pd => {
				pd.selectedFiles = new Set( selected.keys() );
				return pd;
			});

			return mf;
		})
	}
	function removeModFileFromPlan( file: NxmFile )
	{
		mod_files.update( mf => {
			const selected = mf.get( 'selected' ) ?? new Map();
			selected.delete( file.uuid );
			mf.set( 'selected', selected );

			plan_data_store.update( pd => {
				pd.selectedFiles = new Set( selected.keys() );
				return pd;
			});
			return mf;
		})
	}

	// VIEW STATE CACHE/LOAD
	const session_state_id = `${mod.uuid}_view_session_state`;
	let viewState = writable({
		showLinks: false,
		showFiles: false,
		showMainFiles: false,
		showOptionalFiles: false,
		showOldFiles: false
	})
	type view_state = StoreType< typeof viewState >;

	function onMount_view_state() {
		// Load view state from session storage
		const cached_state = sessionStorage.getItem( session_state_id );
		if ( cached_state !== null ) viewState.set( JSON.parse( cached_state ) );
	}
	function onUnmount_view_state() {
		// Write view state to session storage
		sessionStorage.setItem( session_state_id, JSON.stringify( get( viewState ) ) );
	}

	// VIEW STATE MODIFY
	function setView( props: any ) {
		viewState.update( vs => {
			return Object.assign( vs, props );
		})
	}
	function toggleViewProp( prop_key: keyof view_state )
	{
		viewState.update( vs => {
			vs[ prop_key ] = !vs[ prop_key ]
			return vs;
		})
	}

</script>
<container>
	<mod class:incompatible={incompatible_with.length > 0}  >
		<status
			class:incompatible       ={ incompatible_with.length}
			class:required           = {required_by.length}
			class:missingRequirement = {$derived_data.missing_requirements.length > 0}

			on:click   ={()=>toggleViewProp( 'showLinks' )}
			on:keydown ={()=>toggleViewProp( 'showLinks' )}

			role     = "button"
			tabindex = "0"
		>
				{#if incompatible_with.length > 0 }
					<!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M330-120 120-330v-300l210-210h300l210 210v300L630-120H330Zm36-190 114-114 114 114 56-56-114-114 114-114-56-56-114 114-114-114-56 56 114 114-114 114 56 56Zm-2 110h232l164-164v-232L596-760H364L200-596v232l164 164Zm116-280Z"/></svg> -->
					<Icon icon="ic:baseline-report-gmailerrorred" width="28" height="28" />
				{:else if $derived_data.missing_requirements.length > 0 }
					<!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z"/></svg> -->
					<Icon icon="ic:round-warning-amber" width="28" height="28" />
				{:else if required_by.length > 0 }
					<!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/></svg> -->
					<Icon icon="ic:outline-lock" width="28" height="28" />
				{:else }
					<!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg> -->
					<Icon icon="ic:baseline-check" width="28" height="28" />
				{/if}
		</status>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<install_status
			on:click={() => {
				plan_data_store.update( pd => {
					pd.isInstalled = !pd.isInstalled;
					return pd;
				})
			}}
		
			class:installed={$plan_data_store.isInstalled}
		>
			{#if $plan_data_store.isInstalled }
				<Icon icon="ic:outline-check-box" height="26" />
			{:else}
				<Icon icon="ic:outline-check-box-outline-blank" height="26" />
			{/if}
		</install_status>
		<cover style="background-image: url( {mod.cover_image_uri} );" />
		<info>
			<title>
				<a href="/mods/{mod.uuid}">{mod.title}</a>
				{#if mod instanceof NxmMod || mod instanceof GenericWebMod}
					<button on:click={()=>openInBrowser(mod.url)}>
						<Icon icon="ic:baseline-open-in-browser" />
					</button>
				{/if}
			</title>
			<description>{mod.description}</description>
		</info>
		{#if mod?.notes?.length ?? 0 > 0 }
			<notes>
				<SvelteMarkdown source={mod.notes ?? ""} />
			</notes>
		{/if}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<header class='files' on:click={()=>toggleViewProp( 'showFiles' )}><Icon icon="ic:attach-file" />Files</header>
		{#if $viewState.showFiles }
			<!-- File lists -->
			{@const selected_files = Array.from( $mod_files.get( 'selected' )?.values() ?? [] )}
			{@const main_files     = Array.from( $mod_files.get( 'main'     )?.values() ?? [] )}
			{@const optional_files = Array.from( $mod_files.get( 'optional' )?.values() ?? [] )}
			{@const old_files      = Array.from( $mod_files.get( 'old'      )?.values() ?? [] )}

			<article class='files' transition:slide={{duration: 250}}>
				<section class="selected">
					<section>
						<header>
							<Icon icon="ic:bookmark" width="24" height="24" />
							<span>Selected</span>
						</header>
						<ul>
							{#each selected_files as file}
								<li>
									<!-- svelte-ignore a11y-click-events-have-key-events -->
									<!-- svelte-ignore a11y-no-static-element-interactions -->
									<span on:click={async () => {
										await open( file.link, 'firefox' );
									}}>
										<Icon icon="ic:baseline-link" height="24" />
										{file.name}
									</span>
									<button on:click={() => removeModFileFromPlan( file ) }>
										<Icon icon="ic:baseline-keyboard-double-arrow-right" width="25" height="25" />
									</button>
								</li>
							{/each}
						</ul>
					</section>
				</section>
				<section class="unselected">
					<header
						class="main"
						on:click={() => toggleViewProp( 'showMainFiles' ) }
						on:keyup={() => toggleViewProp( 'showMainFiles' ) }
						role     = "button"
						tabindex = "0"
					>
						<Icon icon="ic:baseline-label-important" width="24" height="24" />
						<span>Main</span>
					</header>
					{#if $viewState.showMainFiles}
						<ul class="main" transition:slide={{duration: 250}} >
							{#each main_files as file}
								<li>
									<button on:click={() => addModFileToPlan( file ) }>
										<Icon icon="ic:baseline-keyboard-double-arrow-left" width="25" height="25" />
									</button>
									<span>{file.name}</span>
									<p><SvelteMarkdown source={file.description} /></p>
								</li>
							{/each}
						</ul>
					{/if}
					{#if optional_files.length > 0}
						<header
							class="optional"
							on:click={() => toggleViewProp( 'showOptionalFiles' ) }
							on:keyup={() => toggleViewProp( 'showOptionalFiles' ) }
							role     = "button"
							tabindex = "0"
						>
							<Icon icon="ic:outline-diamond" width="24" height="24" />
							<span>Optional</span>
						</header>
						{#if $viewState.showOptionalFiles}
							<ul class="optional" transition:slide={{duration: 250}}>
								{#each optional_files as file}
								<li>
									<button on:click={() => addModFileToPlan( file ) }>
										<Icon icon="ic:baseline-keyboard-double-arrow-left" width="25" height="25" />
									</button>
									<span>{file.name}</span>
									<p><SvelteMarkdown source={file.description} /></p>
								</li>
								{/each}
							</ul>
						{/if}
					{/if}
					{#if old_files.length > 0}
						<header
							class="old"
							on:click={() => toggleViewProp( 'showOldFiles' ) }
							on:keyup={() => toggleViewProp( 'showOldFiles' ) }
							role     = "button"
							tabindex = "0"
						>
							<Icon icon="ic:baseline-history" width="24" height="24" />
							<span>Old</span>
						</header>
						{#if $viewState.showOldFiles}
							<ul class='old' transition:slide={{duration: 250}}>
								{#each old_files as file}
								<li>
									<button on:click={() => addModFileToPlan( file ) }>
										<Icon icon="ic:baseline-keyboard-double-arrow-left" width="25" height="25" />
									</button>
									<span>{file.name}</span>
									<p><SvelteMarkdown source={file.description} /></p>
								</li>
								{/each}
							</ul>
						{/if}
					{/if}
				</section>
			</article>
		{/if}
		<action>
			<button on:click={removeMod}>
				<Icon icon="ic:baseline-delete-outline" width="32" height="32"/>
			</button>
		</action>
	</mod>
	{#if $viewState.showLinks }
	<links transition:slide={{duration: 300, easing: quintInOut}}>
		{#if incompatible_with.length > 0 }
			<section class='incompatible'>
				<header class='incompatible'>
					<Icon icon="ic:baseline-report-gmailerrorred" width="24" height="24" /><!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M330-120 120-330v-300l210-210h300l210 210v300L630-120H330Zm36-190 114-114 114 114 56-56-114-114 114-114-56-56-114 114-114-114-56 56 114 114-114 114 56 56Zm-2 110h232l164-164v-232L596-760H364L200-596v232l164 164Zm116-280Z"/></svg> -->
					Incompatible
				</header>
				{#each incompatible_with as incompatible}
					<mod_link>
						<button on:click={()=>removeOtherMod(incompatible)}>
							<Icon icon="ic:baseline-add-circle-outline" />
						</button>
						<title><a href="/mods/{incompatible.uuid}">{incompatible.title}</a></title>
					</mod_link>
				{/each}
			</section>
		{/if}
		{#if $derived_data.missing_requirements.length > 0 }
			<section class='requirements'>
				<header class='requirements'>
					<Icon icon="ic:round-warning-amber" width="24" height="24" /><!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z"/></svg> -->
					Missing Requirements
				</header>
				{#each $derived_data.missing_requirements as requirement}
					<mod_link>
						<button on:click={()=>addMod(requirement)}>
							<Icon icon="ic:baseline-add-circle-outline" width="20" height="20" />
						</button>
						<button on:click={()=>skipMod(requirement)}>
							<Icon icon="ic:baseline-do-not-disturb" width="20" height="20" />
						</button>
						<title><a href="/mods/{requirement.uuid}">{requirement.title}</a></title>
					</mod_link>
				{/each}
			</section>
		{/if}
		{#if required_by.length > 0 }
			<section class='required'>
				<header class='required'>
					<Icon icon="ic:outline-lock" width="24" height="24" /><!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/></svg> -->
					Required By
				</header>
				{#each required_by as requirement}
					<mod_link>
						<title><a href="/mods/{requirement.uuid}">{requirement.title}</a></title>
					</mod_link>
				{/each}
			</section>
		{/if}
		{#if $derived_data.skipped_requirements.length > 0 }
			<section class='skipped_requirement'>
				<header class='skipped_requirement'>
					<Icon icon="ic:baseline-do-not-disturb" width="24" height="24" /><!-- <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/></svg> -->
					Skipped Requirements
				</header>
				{#each $derived_data.skipped_requirements as skipped}
					<mod_link>
						<button on:click={()=>unskipMod(skipped)}>
							<Icon icon="ic:baseline-add-circle-outline" width="20" height="20" />
						</button>
						<title><a href="/mods/{skipped.uuid}">{skipped.title}</a></title>
					</mod_link>
				{/each}
			</section>
		{/if}
	</links>
	{/if}
</container>

<style lang="scss">
	@use 'sass:color';

	$col-incompatible:         rgb(168, 41 , 41 );
	$col-missing-requirements: rgb(135, 66 , 123);
	$col-skipped-requirements: rgb(128, 128, 128);
	$col-required-by:          rgb(42 , 97 , 198);
	$col-okay:                 rgb(51 , 114, 51 );
	$col-link:                 #EB6428;
	$mod-margin: 0.25em;

	container {
		mod {
			display: grid;
			grid-template-columns: min-content min-content min-content auto min-content;
			grid-template-areas:
				'status i_status cover info     action'
				'status i_status cover f_header action'
				'status i_status cover files    action'
				'status i_status notes notes    action'
			;

			border: solid 1px #DDD;
			border-radius: 1em;

			margin: $mod-margin;
			margin-bottom: 0;

			overflow: hidden;

			& > * {
				display: inline-block;
			}
			status {
				display: flex;
				align-items: center;
				justify-content: center;
				grid-area: status;
				width: 2em;

				background-color: $col-okay;

				&.required {
					background-color: $col-required-by;
					cursor: pointer;
				}
				&.missingRequirement {
					background-color: $col-missing-requirements;
					cursor: pointer;
				}
				&.incompatible {
					background-color: $col-incompatible;
					cursor: pointer;
				}

				svg {
					fill: #EEE;
					filter: drop-shadow( 0px 0px 3px black );
				}
			}
			install_status {
				grid-area: i_status;

				display:  flex;
				align-items: center;
				justify-content: center;
				
				width: 2em;

				cursor: pointer;
				color: #FFF;
				background-color: #222;
				transition: background-color 150ms ease-in-out;

				&.installed {
					background-color: $col-okay;
				}
			}
			cover {
				grid-area: cover;
				width:  20vw;
				min-height: 10vw;
				background-position: center;
				background-size: cover;
			}
			info {
				display: flex;
				grid-area: info;
				flex-direction: column;

				padding: 0.25em;

				title {
					display: inline-block;
				}

				button {
					border: none;
					background: none;
					color: #EEE;
					font-size: 1.2em;
					cursor: pointer;
					
					&:hover {
						filter: drop-shadow( 0px 0px 5px white );
					}
				}
			}
			header.files {
				grid-area: f_header;
				margin: 0.25em;
				border-bottom: solid 1px #DDD;
				cursor: pointer;
			}
			article.files {
				display: flex;
				flex-direction: row;
				margin: 0.25em;

				section {
					flex-basis: 50%;
					margin-right: 1em;
					margin-left: 1em;

					&.selected li {
						grid-template-columns: auto min-content;
						grid-template-areas:
							'title       button'
							'description button'
						;
					}

					header {
						display: flex;
						flex-direction: row;
						align-items: center;

						font-weight: bold;

						cursor: pointer;

						span {
							margin-left: 0.25em;
						}

						&:not(:first-of-type) {
							margin-top: 1em;
						}
						margin-bottom: 0.25em;
					}

					ul {
						margin: 0;
						padding: 0;
						list-style: none;
					}

					li {
						display: grid;
						grid-template-columns: min-content auto;
						grid-template-areas:
							'button title'
							'button description'
						;

						min-height: 2em;
						margin:  0;
						padding: 0;

						:first-child {
							margin-right: 0.5em;
						}

						&:nth-child( even ) {
							background: #222;
						}

						button {
							grid-area: button;

							align-self: stretch;
							background-color: #EEE;
							border: none;
							color: #222;
							margin:  0;
							padding: 0;

							cursor: pointer;

							transition: background-color 150ms ease-in-out;
							&:hover {
								background-color: #222;
								color: #EEE;
							}
						}

						span {
							grid-area:      title;
							display:        flex;
							flex-direction: row;
							margin:         0;
							color:          $col-link;
							
							cursor: pointer;
							&:hover {
								filter: drop-shadow( 0px 0px 3px color.scale( $col-link, $alpha: -40% ) );
							}

							// & > :global( svg ) {
								
							// }
						}
						p {
							grid-area: description;
							margin:    0;
							font-size: 0.75em;
						}
					}
				}
			}
			notes {
				grid-area: notes;
				background-color: #222;
				padding: 5px;

				max-height: 20em;
				overflow-y: auto;
			}
			action {
				grid-area: action;
				position: relative;
				background-color: #222;
				width: 3em;

				transition: background-color 150ms ease-in-out;

				&:hover {
					background-color: rgb(209, 63, 22);
				}

				button {
					position: absolute;
					cursor: pointer;

					left: 0;
					top: 0;
					right: 0;
					bottom: 0;

					background: none;
					border: none;
					outline: none;

					color: white;
					filter: drop-shadow(0px 0px 3px rgb(0, 0, 0));
				}
			}
		}

		links {
			display: flex;
			flex-direction: row;

			border: solid #DDD 1px;
			border-bottom-right-radius: 0.5em;
			border-bottom-left-radius:  0.5em;
			border-top: none;

			margin-left:  5 * $mod-margin;
			margin-right: 5 * $mod-margin;

			section {
				flex-grow: 1;
				display: flex;
				flex-direction: column;

				&:not( :last-child ) {
					border-right: solid 1px #999;
				}
				
				header {
					display: flex;
					flex-direction: row;
					align-items: center;
					justify-content: center;
					padding: 0.25em;

				}

				&.required header {
					background-color: $col-required-by;
				}
				&.requirements header {
					background-color: $col-missing-requirements;
				}
				&.incompatible header {
					background-color: $col-incompatible;
				}
				&.skipped_requirement header {
					background-color: $col-skipped-requirements;
				}

				mod_link {
					display: flex;
					flex-direction: row;
					margin: 0.25em;

					title {
						display: inline-block;
					}

					button {
						cursor: pointer;
						background: none;
						border: none;
						outline: none;

						color: #DDD;
						vertical-align: middle;

						&:hover {
							filter: drop-shadow( 0px 0px 3px rgba(255, 255, 255, 0.518) );
						}
					}

					&:not( :last-child ) {
						border-bottom: solid 1px #999;
					}
				}
			}
		}
	}
</style>