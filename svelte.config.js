import adapter from '@sveltejs/adapter-static';
import sveltePreprocess from "svelte-preprocess";
const { sass } = sveltePreprocess;

export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
	sass: {
		sync: true,
		implementation: sass,
		quietDeps: true
	}
  }),

  kit: {
	adapter: adapter()
  }
};
