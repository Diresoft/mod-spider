import { ResponseType, fetch } from "@tauri-apps/api/http";
import { JSDOM } from 'jsdom';
import { Mod, ModLink } from "../Mod";
import { Serializable, type Immutable } from "../Serialize";
import { DateTime, Duration } from 'luxon';
import { scopedStorage } from "./scopedLocalStorage";
import { Database } from "@lib/db";
import { NodeHtmlMarkdown } from 'node-html-markdown'


export const nexusmodsStorage = scopedStorage.scope( "nxmInfo" );

/** All information scraped off a Nexusmods Mod Page */
@Serializable({
	uuidProvider( instance ){ return instance.uuid }
})
export class NxmFile {
	uuid!:        string;
	name?:        string;
	description?: string;
	file_id!:     string;
	link!:         string;
}
type NxmModInfo = {
	cache_ts:    DateTime;

	url:         string;
	nxmId:       string;

	title:       string;
	description: string;
	details:     string;
	image:       string;

	requirements: { link: string, note: string }[];

	main_files:     Set<NxmFile>;
	optional_files: Set<NxmFile>;
	old_files:      Set<NxmFile>;
}

/** Expands the base mod class with support for Nexusmods specific data */
@Serializable()
export class NxmMod extends Mod
{
	public static urlToUuid( url: string )
	{
		return `nxmMod_${NxmApiSingleton.parseNxmId( url )}`;
	}

	protected src_info: NxmModInfo;
	public get source_info(): Readonly<NxmModInfo> { return this.src_info; } // For reading values only

	public url:     string;
	public nxmId:   string;
	public details: string;

	public main_files:      Set<NxmFile> = new Set();
	public optional_files?: Set<NxmFile>;
	public old_files?:      Set<NxmFile>;

	constructor( nmInfo: NxmModInfo )
	{
		super( NxmMod.urlToUuid( nmInfo.url ) );
		this.src_info = nmInfo;

		// Initial configuration copies the source into all fields
		this.title           = nmInfo.title;
		this.description     = nmInfo.description;
		this.details         = nmInfo.details;
		this.cover_image_uri = nmInfo.image;
		this.url             = nmInfo.url;
		this.nxmId           = nmInfo.nxmId;

		this.resetRequirements();
		this.resetFiles();
	}

	async reload()
	{
		this.src_info = await NxmApi.getModInfo( this.src_info.url );
	}

	public resetRequirements()
	{
		this.requirements = new Set();
		for( const [_, requirement] of this.src_info.requirements.entries() )
		{
			this.requirements.add( new NxmModLink( requirement ) );
		}
	}

	public resetFiles()
	{
		this.main_files = new Set();
		this.src_info.main_files?.forEach( fd => this.main_files?.add( fd ) );

		this.optional_files = new Set();
		this.src_info.optional_files?.forEach( fd => this.optional_files?.add( fd ) );
		
		this.old_files = new Set();
		this.src_info.old_files?.forEach( fd => this.old_files?.add( fd ) );
	}
}

/** Soft reference to a Nexusmods Mod instance, for lazy loading */
@Serializable()
export class NxmModLink extends ModLink<NxmMod>
{
	public link_url: string;
	public note: string;

	public async get(): Promise<NxmMod>
	{
		this.ref = await super.get();
		if ( this.ref === undefined )
		{
			const info = await NxmApi.getModInfo( this.link_url );
			this.ref = new NxmMod( info );
			await Database.put( this.ref );
		}
		return this.ref;
	}

	constructor( link_info: { link: string, note: string } )
	{
		super( NxmMod.urlToUuid( link_info.link ) );
		this.link_url = link_info.link;
		this.note     = link_info.note;
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
		let cached = NxmApiSingleton.info_lut.get( url ); // Check the runtime LUT first

		// Try and revive from localStorage if it wasn't in the runtime LUT
		if ( cached === undefined )
		{
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
			console.warn( `Cache expired for: ${url}` )
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


		// !!! FRAGILE HTML PARSING !!!
		
		// Markdown transformer
		const nhm = new NodeHtmlMarkdown()

		// Basic metadata
		const mp_response = await fetch( url, {
			method: 'GET',
			responseType: ResponseType.Text
		} );
		const mp_dom = new JSDOM( mp_response.data, {
			url,
			runscripts: "dangerously",
			pretendToBeVisual: true
		});
		
		const mp_doc = mp_dom.window.document;
	
		cached.title 		= ( mp_doc.querySelector( `meta[property='og:title']`)		as HTMLMetaElement ).content;
		cached.description	= ( mp_doc.querySelector( `meta[property='og:description']`)	as HTMLMetaElement ).content;
		cached.image		= ( mp_doc.querySelector( `meta[property='og:image']`)		as HTMLMetaElement ).content;
	
		cached.requirements = [];
		const tabbed_blocks = mp_doc.querySelectorAll( '.tabbed-block' );
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
					if ( link === null ) throw new Error( `Requirement link was null while parsing Nexus Mods page` );
					cached.requirements.push( { link, note: notes[i]?.innerHTML } );
				}
			}
		}

		cached.details = nhm.translate( mp_doc.querySelector( `.mod_description_container` )?.innerHTML ?? "");

		// Parse available files for download
		const fp_response = await fetch( `${url}?tab=files`, {
			method: 'GET',
			responseType: ResponseType.Text
		})
		const fp_dom = new JSDOM( fp_response.data, {
			url: `${url}?tab=files`,
			runscripts: "dangerously",
			pretendToBeVisual: true
		});
		const fp_doc = fp_dom.window.document as Document;

		const main_files_container     = fp_doc.getElementById( "file-container-main-files"     );
		if ( main_files_container !== null )
		{
			cached.main_files = new Set();

			const file_headers = main_files_container.querySelectorAll<HTMLElement>( `dt.file-expander-header` );
			const file_data    = main_files_container.querySelectorAll<HTMLElement>( `dd` );
	
			for( let idx = 0; idx < (file_headers?.length ?? 0); ++idx )
			{
				const headerEl = file_headers[ idx ];
				const dataEl   = file_data   [ idx ];
				const file       = new NxmFile();
				file.name        = headerEl.dataset.name ?? "Unknown File"
				file.description = nhm.translate( dataEl.querySelector( '.files-description' )?.innerHTML ?? "")
				file.file_id     = headerEl.dataset.id ?? "-1"
				file.uuid        = `nxmFile_${file.file_id}`
				file.link        = `https://www.nexusmods.com/skyrimspecialedition/mods/${cached.nxmId}?tab=files&file_id=${file.file_id}&nmm=1`
				await Database.put( file );

				cached.main_files.add( file )
			}
		}

		const optional_files_container = fp_doc.getElementById( "file-container-optional-files" );
		if ( optional_files_container !== null )
		{
			cached.optional_files = new Set();

			const file_headers = optional_files_container.querySelectorAll<HTMLElement>( `dt.file-expander-header` );
			const file_data    = optional_files_container.querySelectorAll<HTMLElement>( `dd` );
	
			for( let idx = 0; idx < (file_headers?.length ?? 0); ++idx )
			{
				const headerEl = file_headers[ idx ];
				const dataEl   = file_data   [ idx ];
				const file       = new NxmFile();
				file.name        = headerEl.dataset.name ?? "Unknown File"
				file.description = nhm.translate( dataEl.querySelector( '.files-description' )?.innerHTML ?? "")
				file.file_id     = headerEl.dataset.id ?? "-1"
				file.uuid        = `nxmFile_${file.file_id}`
				file.link        = `https://www.nexusmods.com/skyrimspecialedition/mods/${cached.nxmId}?tab=files&file_id=${file.file_id}&nmm=1`
				await Database.put( file );

				cached.optional_files.add( file )
			}
		}

		const old_files_container      = fp_doc.getElementById( "file-container-old-files"      );
		if ( old_files_container !== null )
		{
			cached.old_files = new Set();

			const file_headers = old_files_container.querySelectorAll<HTMLElement>( `dt.file-expander-header` );
			const file_data    = old_files_container.querySelectorAll<HTMLElement>( `dd` );
	
			for( let idx = 0; idx < (file_headers?.length ?? 0); ++idx )
			{
				const headerEl = file_headers[ idx ];
				const dataEl   = file_data   [ idx ];

				const file       = new NxmFile();
				file.name        = headerEl.dataset.name ?? "Unknown File"
				file.description = nhm.translate( dataEl.querySelector( '.files-description' )?.innerHTML ?? "")
				file.file_id     = headerEl.dataset.id ?? "-1"
				file.uuid        = `nxmFile_${file.file_id}`
				file.link        = `https://www.nexusmods.com/skyrimspecialedition/mods/${cached.nxmId}?tab=files&file_id=${file.file_id}&nmm=1`
				await Database.put( file );

				cached.old_files.add( file )
			}
		}

		this.putCached( url, cached );
		return cached;
	}
}
export const NxmApi = new NxmApiSingleton();
