import { browser } from "$app/environment";
import type { Subscriber, Unsubscriber, Updater, Writable } from "svelte/store";
import { toJSON, fromJSON } from "../meta/serializable";

type StoreKeyType	= { toString: () => string }
export abstract class PersistedStoreBase<K extends StoreKeyType,T> implements Writable<T>
{
	private static _singleton_lut: Map<any, PersistedStoreBase<any, any>> = new Map();
	
	public readonly Key: K;

	private _val:			T|undefined;
	private _subscribers:	Set<Subscriber<T>> = new Set();

	protected abstract save ( value: T ): void;
	protected abstract load (): T;

	public get Value(): T
	{
		if ( this._val === undefined )
		{
			this._val = this.load();
		}
		return this._val as T;
	}

	public set Value( v: T )
	{
		this.set( v );
	}

	protected updateSubscribers()
	{
		for( const subscriber of this._subscribers )
		{
			subscriber( this.Value );
		}
	}

	public set(value: T): void
	{
		this._val = value;
		if ( browser )
		{
			this.save( this._val );
		}
		this.updateSubscribers();
	}

	public update(updater: Updater<T>): void
	{
		this.set( updater( this.Value ) );
	}

	public subscribe(run: Subscriber<T>): Unsubscriber
	{
		this._subscribers.add( run );
		this.updateSubscribers();
		return () => this._subscribers.delete( run );
		
	}

	public clear()
	{
		if ( browser )
		{
			localStorage.removeItem( this.Key.toString() );
		}
	}

	public constructor( key: K, value?: T )
	{
		this.Key = key;
		if ( PersistedStoreBase._singleton_lut.has( this.Key ) )
		{
			return PersistedStoreBase._singleton_lut.get( this.Key ) as PersistedStoreBase<K, T>
		}

		// Retrieve the value from storage if needed and set my value
		try {
			this.set( value ?? this.Value );
		} catch( _ ) {} // Never fail here though, allow null/undefined values

		PersistedStoreBase._singleton_lut.set( this.Key, this );
	}

}

export class GenericPersistedStore<K extends StoreKeyType, T extends object> extends PersistedStoreBase<K, T>
{
	protected save(value: T): void
	{
		if ( browser )
		{
			localStorage.setItem( this.Key.toString(), toJSON( value, false ) ); // Serialize the value to JSON with the metadata aware jsonifier
		}
	}
	protected load(): T
	{
		try
		{
			if( browser )
			{
				return fromJSON<T>( localStorage.getItem( this.Key.toString() ) as string );
			}
		}
		catch( e )
		{
			console.warn( `GenericPersistedStore: Failed to load item with key ${this.Key.toString()}`, e )
		}
		return null as unknown as T; // Force null return. Recoverable error, but must be handled by caller
	}
	
}