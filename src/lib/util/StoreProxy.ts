import type { ModGroup } from "$lib/app/plan/ModGroup";
import { Plan } from "$lib/app/plan/Plan";
import type { Readable, Subscriber, Updater, Writable } from "svelte/store";

/*

So, the goal of these "proxy" readables is to make a sub-object look, in and of itself, like a Store.
However, rather than just updating the "store" on the object I'm referencing, I actually update the store
of a parent type.

What if I just moved this functionality into the DexieWritable itself? For any sub foreign object property,
I replace it with a proxy which makes the object fulfil the "store contract", but still act as itself.

The problem is that if I just use the parent object's subscribe/set/update functions, then the data passed
to the the callback will be the parent, not the child we're expecting because of the wrapping.
That means that any and all "subscriptions" will need to be made through a passthrough.

This would be the same for the proxy readable/writable anyway. The benefit of doing it inside the Dexie
readable is maybe I could set it up so only the changed part of the object gets written.

If this separate idea works, then I'll consider augmenting the dexie writable with it.

Ah, but here's the issue, that passthrough callback needs to know the keypath of the original location doesn't it?
Well, as long as we're not changing the object, and just it's properties it doesn't need it

*/

type ProxyContext<T extends Object> = {
	target: WeakRef<T>,
	subscribers: Set<Subscriber<T>>,
	unsubscriber?: () => void,
	proxy?: {
		proxy: T,
		revoke: () => void
	}
};

function on_parent( this: ProxyContext<any>, _: Readable<any> ): void
{
	const deref = this.target.deref();
	if ( deref === undefined )
	{ // Our target has been garbage collected. Invalidate the proxy and all context data
		this.subscribers.clear();
		this.proxy?.revoke();
		if ( this.unsubscriber !== undefined )
		{
			this.unsubscriber(); // Stop listening to the parent
		}

		// @ts-ignore
		this.proxy		 = undefined;
		// @ts-ignore
		this.subscribers = undefined;
	}
	else
	{
		for( const run of this.subscribers ) run( deref );
	}
}
function on_subscribe( this: ProxyContext<any>, run: Subscriber<any> )
{
	this.subscribers.add( run );
	run( this.target.deref() );
	return () => {
		this.subscribers.delete( run );
	}
}

export function proxyReadable<T extends Object, TS extends Readable<any>>( target: T, target_store: TS ): Readable<T>
{
	if ( target === undefined ) throw new Error( `Can't wrap an undefined reference with a proxyReadable` );
	
	let context: ProxyContext<T> = {
		target: new WeakRef( target ), // the ProxyReadable is not the owner. Don't hold memory if it's gone
		subscribers: new Set<Subscriber<T>>()
	}

	context.unsubscriber = target_store.subscribe( on_parent.bind( context ) );
	context.proxy = Proxy.revocable( target, {
		get( t: T, p: string|symbol, r: any )
		{
			if ( p === 'subscribe' )
			{
				return on_subscribe.bind( context )
			}
			else
			{
				return Reflect.get( t, p, r );
			}
		}
	});

	// @ts-expect-error - Typescript will never allow this
	return revocable as Readable<T>;
}

export function proxyWritable<T extends Object, TS extends Writable<any>>( target: T, target_store: TS )
{
	if ( target === undefined ) throw new Error( `Can't wrap an undefined reference with a proxyReadable` );
	
	let context: { target: WeakRef<T>, subscribers: Set<Subscriber<T>>, unsubscriber?: () => void } = {
		target: new WeakRef( target ), // the ProxyReadable is not the owner. Don't hold memory if it's gone
		subscribers: new Set<Subscriber<T>>()
	}
	context.unsubscriber = target_store.subscribe( on_parent.bind( context ) );
	
	return new Proxy( target, {
		get( t: T, p: string|symbol, r: any )
		{
			if ( p === 'subscribe' )
			{
				return on_subscribe.bind( context )
			}
			else if ( p === 'update' )
			{
				return ( updater: Updater<T> ): void => {
					
				}
			}
			else
			{
				return Reflect.get( t, p, r );
			}
		}
	} );
}
