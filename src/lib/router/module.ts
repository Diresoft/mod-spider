
// Svelte modules
import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

// === Navigation Module Types ===
// Since the URL I'm using isn't the part that will be user faceing, there's
// no reason not to use the query parameters in the URL object rather
// than trying to parse them out of the URL path.

/** Generic routing error in the ArchiRouter system */
export class ArchiRouterError extends Error {}

/** Navigation event signature */
export type ArchiNavigateFunc = (path: string, props?: SvelteRestProps, breadcrumb? : any) => void

/** Name of the navigation function in the current context */
export const ArchiRouterFrameContextName = "Archiact::RouterFrame";

type RenderComponentFactoryDelegate = (props?: SvelteRestProps) => unknown;

/**
 * Describes a reachable route within the router's defined routes
 * @param {string} path The URI path to reach this route
 * @param {RenderComponentFactoryDelegate} component Function which returns the Svelte component to render
 */
export interface ArchiRoute
{
	path		: string;
	component	: RenderComponentFactoryDelegate
}

export class RouteNode<T>
{
	private __data : any;

	get root() : RouteNode<T>
	{
		if ( ".." in this )
		{
			return (this[".."] as RouteNode<T>).root;
		}
		else
		{
			return this;
		}
	}

	constructor( parent? : RouteNode<T>)
	{		
		this.__data = null;
		if (parent)
		{
			this[".."] = parent;
			this[":"] = this.root;
		}
	}

	private parsePath( path : string ) : { name : string, rest : string}
	{
		const segmentIdx = path.indexOf("/");

		if (segmentIdx > -1)
		{
			return {
				name: path.substring(0, segmentIdx ),
				rest: path.substring(segmentIdx + 1)
			}
		}
		else
		{	// No segments, return the whole path as "name"
			return { 
				name: path,
				rest: null
			}
		}

	}

	normalize( path : string ) : string
	{
		const inSegments	= path.trim().split("/");
		const outSegments	= [];
		for( let idx = 0; idx < inSegments.length; ++idx )
		{
			if ( idx < inSegments.length - 1 && inSegments[idx + 1] === ".." )
			{	// Next level will back us out of this level
				++idx;
				continue;
			}
			else if ( inSegments[idx] === ":" )
			{	// Clear anything before this
				outSegments.splice(0, outSegments.length);
			}
			outSegments.push(inSegments[idx]);
		}

		if (outSegments.length < 1)
		{
			outSegments.push(":");
		}

		return outSegments.join("/");
	}

	insert( path : string, payload? : T, originalPath? : string )
	{
		const { name, rest } = this.parsePath(path);
		//console.log(`insert(${path}, ${originalPath})\nName: "${name}"\nRest: "${rest}" `);

		// Grab the next segment from my children
		let child : RouteNode<T> = this[name];
		if ( name === ":" )
		{
			child = this.root;
		}
		else if ( !child )
		{
			child = this[name] = new RouteNode<T>(this);
		}

		// Either set the data on that child, or recurse lower
		if ( rest && rest.length > 0)
		{
			child.insert(rest, payload, originalPath ?? path);
		}
		else
		{
			child.__data = payload;
		}
	}

	get( path : string, originalPath? : string ) : T
	{
		const { name, rest } = this.parsePath(path);

		let child : RouteNode<T> = this[name];

		if ( name === ":" )
		{
			child = this.root;
		}
		else if ( !child )
		{
			throw new ArchiRouterError(`Unable to retrieve "${originalPath ?? path}". Resource not found in tree`)
		}

		if ( rest && rest.length > 0 )
		{
			return child.get(rest, originalPath ?? path);
		}
		else
		{
			return child.__data;
		}
	}
}

export type ArchiBreadcrumb = { path: string, props: SvelteRestProps, name?: string }
export class ArchiRouter
{
	private routes		: RouteNode <ArchiRoute>	= new RouteNode <ArchiRoute>();
	private uri			: string			= ":";

	private history		: ArchiBreadcrumb[]		= [];
	private tailIdx		: number			= 0;
	private get tail()
	{
		return this.history[ this.tailIdx - 1 ];
	}
	
	// Exposed data
	public Location 	: Writable< string >			= writable( this.uri );
	public View			: Writable< ArchiBreadcrumb >	= writable( null );
	public Breadcrumbs	: Writable< ArchiBreadcrumb[] > = writable( [] );


	constructor( configuredRoutes : ArchiRoute[] )
	{
		// Build the route tree
		for( const route of configuredRoutes )
		{
			this.routes.insert(route.path, route);
		}
	}

	private UpdateSvelteStores()
	{
		this.View.set		( this.tail		);
		this.Location.set	( this.uri		);
		this.Breadcrumbs.set( this.history.slice(0, this.tailIdx )	);
	}

	Navigate( path : string, props? : SvelteRestProps, name? : string )
	{
		// Strip trailing slash
		if (path.endsWith("/"))
		{
			path = path.substring(0, path.length - 1);
		}

		// Update Router internal data
		this.uri = this.routes.normalize( `${this.uri}/${path}` );
		this.history.splice	( this.tailIdx );									// Remove everything after the "tip" of the history since it's no longer valid
		this.tailIdx = this.history.push ( { path: this.uri, props, name } );	// Add a new history element

		// Notify subscribers
		this.UpdateSvelteStores();
	}

	GoBack()
	{
		if ( this.tailIdx < 2 ) return; // Can only go back if we're not already at the first entry

		// No change to the history stack, just a change to where we are in that history stack
		this.tailIdx--; // Lower index is earlier in history, so decrement
		this.uri = this.tail.path;

		// Update the subscribers
		this.UpdateSvelteStores();
	}

	GoToCrumb( crumb : ArchiBreadcrumb )
	{
		// Set the tail idx to the crumb idx to navigate "Back" to it
		const crumbIdx = this.history.indexOf( crumb );
		if ( crumbIdx === -1 )
		{
			throw new ArchiRouterError( `Breadcrumb navigation failed. Crumb with path: ${crumb.path} no longer exists in the history` );
		}

		this.tailIdx = crumbIdx + 1; // Tail IDX ends up being one past the actual level in all other locations, so increment here to match
		this.uri	 = this.tail.path;

		// Update the subscribers
		this.UpdateSvelteStores();
	}

	GoForward()
	{
		if ( this.tailIdx >= this.history.length ) return; // Can only go forward if we're not at the end of the history

		// No change to the history stack, just a change to where we are in that history stack
		this.tailIdx++; // Higher index is closer to present, so increment
		this.uri = this.tail.path;

		// Update the subscribers
		this.UpdateSvelteStores();
	}

	GetNode( path )
	{
		return this.routes.get( path );
	}
}
