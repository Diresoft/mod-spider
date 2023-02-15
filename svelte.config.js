import staticAdapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: staticAdapter(),
	alias:	 {
		"$lib":		'src/lib',
		"$scss":	'src/scss'
	}
  },
};

export default config;
