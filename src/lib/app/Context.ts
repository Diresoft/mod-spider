import type { Icon } from "lucide-svelte";
import type { SvelteComponentTyped } from "svelte";

export type BreadcrumbInfo<T=any> = {
	icon:     Icon;
	iconComponent: ConstructorOfATypedSvelteComponent;
	name:     string;
	uri:      string;
	context?: T;
}
export type ChromeInfo = {
	title: string;
	breadcrumbs: Array<BreadcrumbInfo>
}