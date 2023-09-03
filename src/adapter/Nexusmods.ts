import { ResponseType, fetch } from "@tauri-apps/api/http";
import { JSDOM } from 'jsdom';
import { Mod, ModLink } from "../lib/Mod";
import { Serializable } from "../lib/Serialize";
import { DateTime, Duration } from 'luxon';
import { scopedStorage } from "./scopedLocalStorage";


export const nexusmodsStorage = scopedStorage.scope( "NEXUSMODS" );

/** All information scraped off a Nexusmods Mod Page */
type NxmModInfo = {
	cache_ts:    DateTime;

	url:         string;
	nxmId:       string;

	title:       string;
	description: string;
	image:       string;
	requirements: { link: string, note: string }[]
}

/** Expands the base mod class with support for Nexusmods specific data */
@Serializable()
export class NxmMod extends Mod
{
	public image: string;
	public url:   string;
	public nxmId: string;

	constructor( nmInfo: NxmModInfo )
	{
		super( nmInfo.url );

		Object.assign( this, nmInfo );
		for( const [i, requirement] of nmInfo.requirements.entries() )
		{
			this.requirements[ i ] = new NxmModLink( requirement.link )
		}
	}
}

/** Soft reference to a Nexusmods Mod instance, for lazy loading */
@Serializable()
export class NxmModLink extends ModLink<NxmMod>
{
	public notes: string;
	public async get(): Promise<NxmMod>
	{
		if( this.ref === undefined )
		{
			const info = await NxmApi.getModInfo( this.ref_uuid );
			this.ref = new NxmMod( info );
		}
		return this.ref;
	}
}

class NxmApiSingleton
{
	protected static info_lut: Map<string, NxmModInfo> = new Map();
	protected static MAX_CACHE_AGE: Duration = Duration.fromObject({ days: 1 });

	public static parseNxmId( url: string )
	{
		return url.substring( url.lastIndexOf( '/' ) + 1 );
	}

	protected putCached ( url: string, info: NxmModInfo ): void
	{
		NxmApiSingleton.info_lut.set( url, info );
		nexusmodsStorage.setItem( url, JSON.stringify( info ) );
	}
	protected loadCached( url: string ): NxmModInfo | undefined
	{
		let cached = undefined//NxmApiSingleton.info_lut.get( url ); // Check the runtime LUT first

		// Try and revive from localStorage if it wasn't in the runtime LUT
		if ( cached === undefined )
		{
			console.log( `info_lut cache miss for: ${url}` );
			const raw = nexusmodsStorage.getItem( url );
			if ( raw !== null )
			{
				let cached = JSON.parse( raw ) as NxmModInfo;
				cached.cache_ts = DateTime.fromISO( cached.cache_ts as unknown as string ); // cache_ts will be serialized as a string by JSON.stringify
			}
		}
		
		// Check if the cached data has expired
		if ( cached !== undefined && cached.cache_ts.diffNow() > NxmApiSingleton.MAX_CACHE_AGE )
		{
			cached = undefined;
			nexusmodsStorage.removeItem( url );
		}

		return cached; // Either revived and not expired or undefined
	}
	public async getModInfo( url: string ): Promise<NxmModInfo>
	{
		let cached = this.loadCached( url );
		if ( cached !== undefined ) return cached;
		// Full cache miss. We'll need to run a scrape

		cached = {
			cache_ts: DateTime.now(),
			url,
			nxmId: NxmApiSingleton.parseNxmId( url )
		} as NxmModInfo;
		const response = await fetch( url, {
			method: 'GET',
			responseType: ResponseType.Text
		} );
		const dom = new JSDOM( response.data, {
			url,
			runscripts: "dangerously",
			pretendToBeVisual: true
		});
		
		// !!! FRAGILE HTML PARSING !!!
		const document = dom.window.document;
	
		// Basic metadata
		cached.title 		= ( document.querySelector( `meta[property='og:title']`)		as HTMLMetaElement ).content;
		cached.description	= ( document.querySelector( `meta[property='og:description']`)	as HTMLMetaElement ).content;
		cached.image		= ( document.querySelector( `meta[property='og:image']`)		as HTMLMetaElement ).content;
	
		cached.requirements = [];
		const tabbed_blocks = document.querySelectorAll( '.tabbed-block' );
		for( const block of tabbed_blocks )
		{
			const header = block.querySelector( 'h3' )?.innerHTML;
			if ( !header ) continue;
			
			if ( header === "Nexus requirements" )
			{
				const links: HTMLElement[] = block.querySelectorAll( 'td.table-require-name a' );
				const notes: HTMLElement[] = block.querySelectorAll( 'td.table-require-notes');
	
				for( let i = 0; i < links.length; ++i )
				{
					const link = links[i].getAttribute( 'href' );
					cached.requirements.push( { link, note: notes[i]?.innerHTML } );
				}
			}
		}

		this.putCached( url, cached );
		return cached;
	}
}
export const NxmApi = new NxmApiSingleton();
