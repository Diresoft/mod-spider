import { Guid } from "../util/Guid";
import { fetch, ResponseType } from '@tauri-apps/api/http';
import { Reflection } from "../meta/reflection";
import { Database } from "../meta/database";

export class ModTag
{
	public readonly guid	: Guid = Guid.Create();
	public readonly value	: string;
	constructor( value : string ) { this.value = value; }
}

export abstract class ModScraperInterface
{
	public	owner		: Mod 		| undefined;
	public	ready		: boolean	| Promise<ModScraperInterface> = false;
	public	title		: string	| undefined;
	public	description : string	| undefined;
	public	img			: string	| undefined;
	public	feature		: string	| undefined;

	public async load() : Promise<ModScraperInterface>
	{
		this.ready = this.onLoad();
		await this.ready;
		this.ready = true;
		return this;
	}
	protected abstract onLoad() : Promise<ModScraperInterface>;
}

export class NexusModData extends ModScraperInterface
{
	public nexus_id	: number;
	public URI		: string;

	constructor( URI : string )
	{
		super();
		this.URI = URI;
		this.nexus_id = parseInt(/mods\/(?<id>[0-9]+)/.exec( URI )?.groups?.id ?? '-1');
	}

	protected async onLoad(): Promise<ModScraperInterface>
	{
		//await FOREVER;
		//await SLEEP(5000);
		const response = await fetch( this.URI, {
			method: 'GET',
			responseType: ResponseType.Text
		});
		
		const root = new DOMParser().parseFromString( response.data as string, "text/html" );

		this.description	= root.querySelector( "meta[property='og:description']"	)?.getAttribute('content') ?? "No description provided";
		this.title			= root.querySelector( "meta[property='og:title']"		)?.getAttribute('content') ?? `Nexus Mod: ${this.nexus_id}`;
		this.img			= root.querySelector( "meta[property='og:image']"		)?.getAttribute('content') ?? 'covers/skyrim.jpg';

		const feature_bg_css = root.querySelector<HTMLElement>("#feature")?.style?.backgroundImage ?? false;
		if ( feature_bg_css )
		{
			this.feature = /url\("(?<url>[^"]+)"\)/.exec( feature_bg_css )?.groups?.url ?? this.img;
		}

		return this;
	}
}

export class PatreonModData extends ModScraperInterface
{
	protected onLoad(): Promise<ModScraperInterface> {
		throw new Error("Method not implemented.");
	}

}

// @Database.Manage
@Reflection.Class( () => {
	return new Mod( Reflect.construct( ModScraperInterface, [] ) );
} )
export class Mod
{
	// -~= Properties =~-

	// - Private
	public	_data	: ModScraperInterface;

	// - Protected


	// - Public
	public testString: string = "I'm a string";
	public testNum: number = 42;
	public testBool: boolean = true;
	public testObj: object = {};

	//@DireReflection.Member(Guid)
	public readonly	guid	: Guid	= Guid.Create();
	
	public get data()
	{
		if ( this._data.ready === true ) return Promise.resolve( this._data );
		return this._data.load();
	}

	public set data( val )
	{

	}
	
	// -~= Methods =~-
	// - Static


	// - Constructor
	constructor( data_source : ModScraperInterface )
	{
		this._data = data_source;
		this._data.owner = this;
	}

	public ImAFunction( str: string ): boolean
	{
		
	}
}
