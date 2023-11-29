import { liveQuery, type Observable, type Table } from "dexie";
import type { Invalidator, Subscriber, Unsubscriber, Updater, Writable } from "svelte/store";

// TODO: What if we wrap a result that's an emphemerial type? I.e. an array of all objects in the database. We can't "put" or "update" that, so this will throw errors
// Current solution: Just let that fail. Behavior is unsupported.

export class WrappedQuery<T = any, TableType extends Table<T> = Table<T>> implements Writable<T>
{
    protected readonly default: undefined | T;
    protected readonly query: Observable<T>;
    protected readonly table: TableType;

    constructor( table: TableType, querier: () => T | Promise<T>, defaultValue?: T )
    {
        this.default = defaultValue;
        this.table   = table;
        this.query   = liveQuery( querier );
    }


    set( value: T, key ?: any ): void {
        this.table.put( value, key ); // Put the provided object in the database. If it has the same key, the liveQuery will handle callbacks. We don't know the original key, so we can't check.
    }

    update( updater: Updater<T>, key ?: any ): void {
        if( !this.query.getValue ) throw new Error( `Unsupported on liveQueries without a 'getValue' method` );
        
        const nv = updater( this.query.getValue() ?? this.default as T );
        this.set( nv, key );
    }

    subscribe( run: Subscriber<T> ): Unsubscriber {
        if( !this.query.getValue ) throw new Error( `Unsupported on liveQueries without a 'getValue' method` );

        const wrapper = ( v: T | undefined ) => {
            run( v ?? this.default as T );
        }
        wrapper( this.query.getValue() );
        return this.query.subscribe( wrapper ) as unknown as Unsubscriber;
    }
}