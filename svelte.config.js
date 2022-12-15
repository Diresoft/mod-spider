import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';
import { resolve } from 'node:path';
import { SassAlias } from 'svelte-preprocess-sass-alias-import';

const alias = new SassAlias({
	//"$scss": 'src/scss',
 	"@scss": ["src", "scss"],
 	"@sass": ["src", "scss"]
});

/** @type {import('@sveltejs/kit').Config} */
const config = {

	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(
		{
			scss: {
				importer: [ alias.resolve.bind( alias ) ],
				renderSync: true,
				outputStyle: 'expanded'
			}
		}
	),

	kit: {
		adapter: adapter(),
		alias: {
			"$lib": resolve( './src/lib' )
		}
	}
};

export default config;
