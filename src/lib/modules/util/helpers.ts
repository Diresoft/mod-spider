import { goto } from "$app/navigation";
import type { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/window";

export function btnAnchor( url : string | URL ) { return () => goto( url ); }

export class WindowRect
{
	public left		: number;
	public right	: number;
	public top		: number;
	public bottom	: number;
	public center	: { x: number, y: number };
	public size		: { x: number, y: number };
	constructor( pos : PhysicalPosition, size : PhysicalSize )
	{
		this.left	=	pos.x;
		this.right	=	pos.x + size.width;
		this.top	=	pos.y;
		this.bottom	=	pos.y + size.height;
		this.center	=	{
			  x:	pos.x + ( size.width  / 2 )
			, y:	pos.y + ( size.height / 2 )
		};
		this.size	= {
			  x: size.width
			, y: size.height
		};
	}

	outside( point : { x: number, y: number } )
	{
		return point.x < this.left || point.x > this.right || point.y < this.top || point.y > this.bottom;
	}

	inside( point : { x: number, y: number } )
	{
		return !this.outside( point );
	}
}

export function SLEEP( ms : number )
{
	console.warn( `[DEBUG_ONLY_WARNING] CALL TO SLEEP` )
	return new Promise( res => setTimeout( res, ms ) );
}