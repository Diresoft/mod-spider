import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: "200.html"
		}),
		prerender: {
			entries: [
				"/planner",
				"/planner/[plan_id]",
				"/planner/[plan_id]/edit",
				"/planner/[plan_id]/edit/[group_id]",
				"/mod_db",
			]
		},
		alias:		{
			"$lib":			'src/lib',
			"$scss":		'src/scss',
			"$components":	'src/components'
		}
	}
};

export default config;
