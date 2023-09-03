/*
So I don't want the object itself to be a store, but I do want to be using a store type that automatically revives itself using the serialization system.
*/

import { writable, type Invalidator, type Subscriber, type Unsubscriber, type Updater, type Writable } from "svelte/store";
import type { DataProvider, JsonType, SerializeTyped } from "./Serialize";

// Direct I/O to the browser local storage. JSONifies incoming data and JSONparses the incoming data
export class LocalStorageDataProvider implements DataProvider
{
	has(uuid: string): Promise<boolean>
	{
		return Promise.resolve( localStorage.getItem( uuid ) !== null );
	}
	put(uuid: string, data: SerializeTyped<any>): Promise<void>
	{
		return Promise.resolve( localStorage.setItem( uuid, JSON.stringify( data ) ) )
	}
	get<T>(uuid: string): Promise<SerializeTyped<JsonType<T>>>
	{
		const raw = localStorage.getItem( uuid );
		if ( raw === null )
		{
			throw new Error( `${uuid} does not exist in localStorage` );
		}
		return Promise.resolve( JSON.parse( raw ) );
	}
}


/*
For the store, it gets a little tricky. I want a zero effort situation when it comes to how the store is used.
Naturally, it needs to implement the store contract in svelte
Secondly, after reviving, two stores pointing at the same uuid need to be the same reference and be pointer equal
Thirdly, all of these store types need to be defined with a UUID that will be used to revive the store.

In the past, ive run into issues where modifying sub members will not trigger updates for those sub members if they are also used in stores anywhere.
This is a little tricky, and I'm not sure I can truly solve this issue from the store alone. Unless I convert the original member's submember to be a store.

That starts to get a little cumbersome though... Although, I could probably use the toJSON to make the store transparent to the serializer so it serializes as
the actual type, then deserializes as a store :thinking_face:

I mean, this isn't a me issue. This is a general issue with stores. They're not meant to reference big objects. I feel like they're kinda intended to be small
content references.

The use case I have in mind is:

User begins working on a Mod Plan. The Mods are listed in groups. You open a Mod Group, then open a Mod. You add or remove a Mod. The UI should update the whole
mod list because that one mod group was modified.

If an object references another object which is intended to be a store, it should always return something that will cause the parent store to call it's subscribers when a sub
member is called

Basically, wrapping something in this type would kinda be like a virus. It would attach itself to every object member and bind to any setters or getters. The returned values
would be proxies rather than the actual objects. Which means the value the store wraps should _also_ be a proxy.

Of note, how do I make the sub members update when the parent does? I guess they wouldn't, since stores wrapping sub members wouldn't actually track the parent

I would also want to make sure the stores are reference equal when wrapping an object. Both that and UUID of some kind?

---

Unless I can refactor this whole idea to be more functional and less OOP.
Right now I'm hung up on the idea that to modify a sub member I need to access the parent, then pass the sub member as a prop to a component.
Instead, I should use the store to store the currently selected "thing" outside the component tree. Then the component tree itself retrieves content from that store?

No I hate that, I like my viral store idea more, although it's janky as fuck.

---

Okay, rather than making every member of the store always return wrapped object. Why don't I make a function like, `getMemberAsStore()` or something. That way I can use that function to extract store
objects that are listeners of the parent, as well as emitters back up to the parent.
*/

class __writable_wrapper<T> implements Writable<T>
{
	protected value?: T;
	protected subscriber_set  = new Set< Subscriber <T> >();
	protected invalidator_set = new Set< Invalidator<T> >();
	protected cleanup_set     = new Set< () => void     >();

	protected notify()
	{
		for( const subscriber of this.subscriber_set )
		{
			subscriber( this.value );
		}
	}
	protected cleanup()
	{
		this.value = undefined;
		for( const invalidator of this.invalidator_set )
		{
			invalidator( this.value );
		}
		for( const cleanup of this.cleanup_set )
		{
			cleanup();
		}
	}

	set( value: T ): void
	{
		this.value = value;
		this.notify();
	}
	
	update( updater: Updater<T >): void
	{
		this.value = updater( this.value );
		this.notify();
	}

	subscribe( run: Subscriber<T>, invalidate?: Invalidator<T> ): Unsubscriber
	{
		this.subscriber_set .add( run        );
		this.invalidator_set.add( invalidate );
		return () => {
			this.subscriber_set .delete( run        );
			this.invalidator_set.delete( invalidate );
			if ( this.subscriber_set.size < 1 )
			{
				this.cleanup();
			}
		}
	}

	onCleanup( run: () => void ): Unsubscriber
	{
		this.cleanup_set.add( run );
		return () => {
			this.cleanup_set.delete( run );
		}
	}

	constructor( value: T )
	{
		this.value = value;
	}
}

export function getMemberAsStore<T extends object, K extends keyof T = keyof T, MT = T[K]>( target: Writable<T>, prop: K ): Writable<MT>
{
	const out = new __writable_wrapper( Reflect.get( target, prop ) as MT );
	const out_unsubscriber    = out.subscribe( () => {
		target.update( v => v ); // Force the target to update when the store we create does
	})
	const target_unsubscriber = target.subscribe( () => {
		out.update( v => v ); // Force the resulting store to update when the parent does
	})
	// When the returned store looses it's last subscriber
	out.onCleanup( () => {
		out_unsubscriber();
		target_unsubscriber();
	})

	return out;
}

// I still think this is a little more than I need right now