import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import type { Point } from "../math/Point";
import { Rect } from "../math/Rect";

/*
 * Note: It's possible that cross window drag could be implemented using file drag, but I'm unclear
 * on how to set that up using Tauri and HTML drag support
 * 
 * Drag and drop requires the user to be actively holding the left mouse button down the entire time.
 * This means that only one entity can be "in flight" at a time, since you'd need to release the mouse button,
 * thereby cancelling the drag, in order to start a new drag.
 * 
 * I _could_ probably build the system to support multiple drags, which would be possible if there were
 * multiple mouse cursors moving on the system, but I don't intend to make this app realtime collaborative, so
 * it should be a safe assumption that only a single "in flight" entity is needed at a time.
 * To that end, I will _explicitly_ support only a single entity so that the system does not seem incomplete or
 * bugged due to lack of generic count support.
 */

export type		MultiWindowDragEvent	= { pos : null | Point, payload : unknown, bIsBlockedBySenderWindow : boolean }
export type		MultiWindowDragHandler	= ( event : MultiWindowDragEvent ) => void | Promise<void>;

const	_mwdMoveUpdateDelay	= 150; //ms
const	_mwdNoInflightPayload : unique symbol = Symbol( 'MWD_NO_PAYLOAD' );
const	_mwdBridgeEventName	= 'mwdEvent';
type	_mwdBridgeEvent		= { name : string } & MultiWindowDragEvent;
type	_mwdHandlerData		= MultiWindowDragHandler;
export class MultiWindowDragBridge {
	private constructor() {}; // Lock out the constructor as this is a static class

	// API
	private static last_move_event_time : number = 0;
	private static listeners			: Map<string, Set< _mwdHandlerData > > = new Map();
	private static inflight				: typeof _mwdNoInflightPayload | unknown = _mwdNoInflightPayload;
	private static wnd_event_unlistener	: undefined | ( () => void );

	private static async bIsOverOwnWnd( pos : Point ) : Promise< boolean >
	{
		// Must be dynamic as the window size changes
		const ip = await appWindow.innerPosition();
		const is = await appWindow.innerSize();
		const own_wnd_rect = new Rect( ip, { x: is.width, y: is.height } );
		return own_wnd_rect.inside( pos );
	}

	private static receive( event : _mwdBridgeEvent )
	{
		const handlers = MultiWindowDragBridge.listeners.get( event.name ) ?? [];
		for( const handler of handlers )
		{
			handler( event );
		}
	}

	private static async send( name : string, payload : unknown, pos : null | Point = null )
	{
		const event = { name, pos, payload, 
			bIsBlockedBySenderWindow: pos !== null && await MultiWindowDragBridge.bIsOverOwnWnd( pos )
		}
		
		await emit( _mwdBridgeEventName, event );
	}

	private static mousemove( e : MouseEvent ) : void
	{
		if ( this.inflight === _mwdNoInflightPayload ) throw Error( `\`MultiWindowDragBridge.mousemove\` is still bound while \`inflight\` is \`null\`` );
		
		if ( Date.now() - MultiWindowDragBridge.last_move_event_time > _mwdMoveUpdateDelay )
		{	// Don't emit every tick
			MultiWindowDragBridge.last_move_event_time = Date.now();
			MultiWindowDragBridge.send( "drag", MultiWindowDragBridge.inflight, { x: e.screenX, y: e.screenY } );
		}
	}

	private static mouseup( e : MouseEvent ) : void
	{
		if ( this.inflight === _mwdNoInflightPayload ) throw Error( `\`MultiWindowDragBridge.mouseup\` is still bound while \`inflight\` is \`null\`` );

		MultiWindowDragBridge.send( "dragend", MultiWindowDragBridge.inflight, { x: e.screenX, y: e.screenY } );
		MultiWindowDragBridge.EndEvent();
	}

	private static EndEvent()
	{
		window.removeEventListener( 'mousemove',	MultiWindowDragBridge.mousemove	);
		window.removeEventListener( 'mouseup',		MultiWindowDragBridge.mouseup	);
		this.inflight = _mwdNoInflightPayload;
	}

	static async AbortEvent()
	{
		MultiWindowDragBridge.send( "dragcancel", MultiWindowDragBridge.inflight );
		MultiWindowDragBridge.EndEvent();
	}

	static async CreateEvent<T>( payload : T )
	{
		if ( MultiWindowDragBridge.inflight !== _mwdNoInflightPayload )
		{
			MultiWindowDragBridge.AbortEvent();
		}
		MultiWindowDragBridge.inflight = payload;

		// Bind input handlers
		window.addEventListener( 'mousemove',	MultiWindowDragBridge.mousemove	);
		window.addEventListener( 'mouseup',		MultiWindowDragBridge.mouseup	);
		MultiWindowDragBridge.send( "dragstart", MultiWindowDragBridge.inflight, null );
	}

	static on ( event_name : string, handler : MultiWindowDragHandler )
	{
		const handlers = MultiWindowDragBridge.listeners.get( event_name ) ?? new Set();
		handlers.add( handler );
		MultiWindowDragBridge.listeners.set( event_name, handlers );
	}

	static off ( event_name : string, handler : MultiWindowDragHandler )
	{

	}

	public static async _initialize() 
	{
		// Track the unlistener so we can unbind when the window closes
		MultiWindowDragBridge.wnd_event_unlistener = await listen<string>( _mwdBridgeEventName, (e) => {
			if( e.windowLabel === appWindow.label ) return; // Ignore own broadcast events
			MultiWindowDragBridge.receive( JSON.parse( e.payload ) as _mwdBridgeEvent )
		} );
		// When the window closes, make sure we destroy the listener
		await appWindow.onCloseRequested( async () => {
			if ( MultiWindowDragBridge.wnd_event_unlistener ) MultiWindowDragBridge.wnd_event_unlistener();
		})
	}
}
MultiWindowDragBridge._initialize();

/*
Use Like
	MultiWindowDragBridge.CreateEvent( "hello world" );

	MultiWindowDragBridge.on( 'dragstart', ( e ) => {
		console.log( `${appWindow.label} recieved dragstart with payload`, e );
	})
	MultiWindowDragBridge.on( 'drag', ( e ) => {
		if ( e.bIsBlockedBySenderWindow ) return; // Don't try and update movement if it's stil over the original window

		console.log( `${appWindow.label} recieved drag with payload`, e );
	})
	MultiWindowDragBridge.on( 'dragend', ( e ) => {
		
		console.log( `${appWindow.label} recieved dragend with payload`, e );
	})

*/