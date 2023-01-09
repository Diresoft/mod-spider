import staticAdapter	from "@sveltejs/adapter-static";
import preprocess 		from "svelte-preprocess";
import { resolve }		from 'node:path';
import { SassAlias }	from "svelte-preprocess-sass-alias-import";

/**
 * SCSS Path Alias
 */
const _scss_alias = new SassAlias({
	"$scss": './src/scss'
})

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess({
		scss: {
			importer:		[ _scss_alias.resolve.bind( _scss_alias ) ],
			renderSync:		true,
			outputStyle:	'expanded'
		}
	}),
	kit: {
		adapter:	staticAdapter(),
		alias:		{
			"$lib": resolve( './src/lib' )
		}
	},
};

export default config;
