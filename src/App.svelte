<script lang="ts">
    import { get, writable, type Writable } from "svelte/store";
    import { NexusMod, NexusModReference } from "./lib/parseNexusModpage";
    import type { ModReference } from "./lib/Mod";
    import { onMount } from "svelte";
    import { Serializable, type DataProvider, type UuidType, type JsonType, type Immutable, type SerializeTyped } from "./lib/Serialize";

	const plan: Writable<ModReference[]> = writable( [] );

	async function savePlan()
	{
		const references = get(plan);

		// Serialize the mods themselves
		for( const ref of references )
		{
			const val = await ref.Get();

			const serialized = JSON.stringify( val );

			localStorage.setItem( val.uuid, serialized );
		}

		// Serialize the plan
		localStorage.setItem( 'plan', JSON.stringify( references ) );
	}
	async function loadPlan()
	{
		// const plan_raw = localStorage.getItem( 'plan' );
		// const plan_arr = JSON.parse( plan_raw );
		// console.log( plan_arr );
	}

	@Serializable()
	class Fiz {
		static index: number = 0;
		public uuid: string = `Fiz:${++Fiz.index}`;
		public info = "I'm a Fiz!";
		public myFoo?: Foo;
	}

	const BAD_JSON_KEY1 = Symbol( "BAD_JSON_KEY1" );
	const BAD_JSON_KEY2 = Symbol( "BAD_JSON_KEY2" );

	@Serializable({
		uuidProvider( instance ) {
			return instance.name;
		}
	})
	class Foo {
		static index: number = 0;

		public [BAD_JSON_KEY1] = "A JsonPrimitive that should not be seen!";
		public [BAD_JSON_KEY2] = function aValueThatCantBeJsonified() {};
		public GOOD_JSON_KEY1 = "A JsonPrimitive that should be seen!"
		public GOOD_JSON_KEY2 = function aValueThatCantBeJsonified() {};

		public name: string = `Foo:${++Foo.index}`;
		public foo_ref?: Foo;
		public fiz_ref: Fiz = new Fiz();
		public faz = { bar: "Bam", boo: "Buz"}
		constructor( bDoSubref: boolean = false )
		{
			if ( bDoSubref )
			{
				this.foo_ref = new Foo();
			}
			this.fiz_ref.myFoo = this;
		}
	}

	async function addModFromURL( mod_url: string )
	{
		const foo  = new Foo( false );
		const foo2 = new Foo( false );
		// foo.foo_ref.foo_ref = foo2;
		// foo2.foo_ref.foo_ref = foo;
		foo.foo_ref = foo2;
		foo2.foo_ref = foo;

		foo.GOOD_JSON_KEY1 = "A changed JSON visible value!";
		foo[BAD_JSON_KEY1] = "A changed JSON not serialized value!";

		console.log( "Made Test Values" );
		// console.log( "foo:\n", foo );

		class TestProvider implements DataProvider
		{
			protected map = new Map< string, any >();
			async has( uuid: string ): Promise<boolean>
			{
				return this.map.has( uuid );
			}
			async put<T>(uuid: string, data: JsonType<T>)
			{
				//console.log( `DATA_PROVIDER: ${uuid} ->\n${JSON.stringify( data, null, '\t' )}` )
				this.map.set( uuid, data );
			}
			async get<T>(uuid: string): Promise< SerializeTyped< JsonType<T> > >
			{
				return this.map.get( uuid );
			}
		}
		const provider = new TestProvider();

		const d_foo = await Serializable.Dehydrate( foo, provider );
		// console.log( "provider:\n", provider );
		console.log( "foo:\n", foo );
		console.log( "d_foo:\n", d_foo );

		const h_foo = await Serializable.Hydrate( d_foo, provider );
		console.log( "h_foo\n", h_foo );
	}

	onMount( async () => {
		await loadPlan();
	});

	let nexusmodsUrl: string = "https://www.nexusmods.com/skyrimspecialedition/mods/93962";
	// let nexusmodsUrl: string = "https://www.nexusmods.com/skyrimspecialedition/mods/32444";
</script>

<main class="container">

	<input type="text" placeholder="Nexusmods URL" bind:value={nexusmodsUrl} />
	<button on:click={() => addModFromURL(nexusmodsUrl)}>Add Mod</button>

	<article>
		{#each $plan as ref }
			{#await ref.Get()}
				<p>Loading...</p>
			{:then mod}
				{#if mod.requirements.length > 0 }
					<h1>Has Requirements!</h1>
				{/if}
				<article>
					<header>{mod.title}</header>
				</article>
			{/await}
		{/each}
	</article>

</main>

<style>
</style>