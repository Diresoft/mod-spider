import type { ArchiRoute } from '../lib/router/RouterFrame.svelte';

// Pages
import HelloWorld from './HelloWorld.svelte';

const routes : ArchiRoute[] = [
	{
		path: ':/',
		component: () => HelloWorld
	}
]
export default routes;