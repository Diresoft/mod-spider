export type EventUnsubscriber = () => void;
export type EventHandler = (...args: unknown[] ) => unknown;
export type EventMapType = {
	[event_identifier:number|string|symbol]: EventHandler
};

export interface EventEmitterInterface<T extends EventMapType> {
	on<K extends keyof T>( event_type: K, handler: T[K] ): EventUnsubscriber;
	emit<K extends keyof T>( event_type: K, args: Parameters<T[K]> ): void;
}

export class EventEmitter<T extends EventMapType> implements EventEmitterInterface<T>
{
	private _listeners: Map<unknown, Array<EventHandler>> = new Map();

	on<K extends keyof T>(event_type: K, handler: T[K]): EventUnsubscriber {
		if ( !this._listeners.has( event_type ) )
		{
			this._listeners.set( event_type, [] );
		}
		const event_listeners = this._listeners.get( event_type ) as Array<EventHandler>;
		event_listeners.push( handler );
		return () => {
			event_listeners.filter( v => v !== handler );
		}
	}

	emit<K extends keyof T>(event_type: K, args?: Parameters<T[K]> ): void {
		const event_listeners = this._listeners.get( event_type );
		if ( event_listeners !== undefined )
		{
			for( const listener of event_listeners )
			{
				listener( ...(args ?? [] ) );
			}
		}
	}
	
}