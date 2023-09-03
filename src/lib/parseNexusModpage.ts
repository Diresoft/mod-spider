import { ResponseType, fetch } from '@tauri-apps/api/http';
import { JSDOM } from 'jsdom';
import { Mod } from './Mod';
import { Serializable } from './Serialize';

export class NexusMod extends Mod
{
	// Static Helpers
	public static url_root: string = 'https://www.nexusmods.com/skyrimspecialedition/mods';
	public static urlFromId( modId: string ): string {
		return `${NexusMod.url_root}/${modId}`;
	}
	public static idFromUrl( url: string ): string {
		const match = /mods\/(?<id>[0-9]+)/.exec( url );
		const id = match?.groups[ 'id' ];
		if ( id === undefined ) throw new Error( `Unable to parse Nexus ModID from NexusMods URL: \"${url}\"` );
		return id;
	}

	// Members
	public image: string;

	public async populateFromWeb()
	{
		const url = NexusMod.urlFromId( this.uuid );
		console.log( `Get url: ${url}` );
		const response = await fetch( url, {
			method: 'GET',
			responseType: ResponseType.Text
		} );
		console.log( `Got response`, response );
		const dom = new JSDOM( response.data, {
			url,
			runscripts: "dangerously",
			pretendToBeVisual: true
		});
		console.log( `Got DOM`, dom );

		const document = dom.window.document;
		

		// !!! FRAGILE HTML PARSING !!!

		// Basic metadata
		this.title 			= ( document.querySelector( `meta[property='og:title']`)		as HTMLMetaElement ).content;
		this.description	= ( document.querySelector( `meta[property='og:description']`)	as HTMLMetaElement ).content;
		this.image			= ( document.querySelector( `meta[property='og:image']`)		as HTMLMetaElement ).content;

		this.requirements = [];
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
					const modlink = new ModLink(
						new NexusModReference( this ),
						NexusModReference.fromUrl( link )
					)

					if ( notes[i] )
					{
						modlink.notes.push( notes[i].innerHTML );
					}
					this.requirements.push( modlink );
				}
			}
		}
	}
}

export class NexusModReference extends ModReference<NexusMod>
{
	public static fromUrl( nexus_url: string, value?: NexusMod )
	{
		return new NexusModReference( NexusMod.idFromUrl( nexus_url ), value );
	}

	protected async factory( uuid: string ): Promise<NexusMod>
	{
		// Expect uuid to be Nexusmods ModID
		const out = new NexusMod( uuid );
		await out.populateFromWeb();
		return out;
	}
}