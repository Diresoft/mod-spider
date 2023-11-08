<script lang='ts'>
    import { page } from '$app/stores';
    import { ModPlan } from '@lib/Plan';
    import { Database } from '@lib/db';
    import { setContext } from 'svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Node, Svelvet, Minimap, Controls } from 'svelvet';
    import ModNode from './components/ModNode.svelte';

    let plan_name: string;
	let plan     : Writable<ModPlan> = writable( new ModPlan() );
	setContext( 'plan', plan );
	
	async function loadPlan( name: string )
	{
		const p = await Database.get<ModPlan>( name );
		p.process();
		plan.set( p );

		return p;
	}

	$: plan_name    = $page.params.uuid;
	$: mods_in_plan = $plan.allMods;
	$: {
		loadPlan( plan_name );
		localStorage.setItem( "active_plan_uuid", plan_name );
	}
</script>

<article>
    <nav>
        <a href="/">Home</a>
    </nav>
    <header>Graph View</header>
    <section>
        <Svelvet id='graph' minimap snapTo={10} theme=dark>
            {#each mods_in_plan as mod}
                <ModNode bind:mod bind:plan />
            {/each}
        </Svelvet>
    </section>
</article>

<style lang="scss">
    article {
        position: relative;
        display: grid;
        grid-template-columns: min-content auto;
        grid-template-rows:    min-content auto;
        grid-template-areas:
            'nav header'
            'nav graph'
        ;
        height: 100vh;
    }
    nav {
        grid-area: nav;
    }
    header {
        grid-area: header;
    }
    section {
        grid-area: graph;
    }
</style>