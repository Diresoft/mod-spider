import type { Class, Constructor, _ctor } from "../util/types";
import { Reflection } from "./reflection";

export namespace Database
{
	export class DatabaseError extends Error { }
	export class DatabaseConfigurationError extends Error { }

	// DATABASE TYPES
	export class Index<InstanceType extends object>
	{
		private lut: Map<any, Set<InstanceType>> = new Map();

		public get instances(): Set< InstanceType >
		{
			const out		= new Set<InstanceType>();
			const values	= this.lut.values();
			for( const set of values )
			{
				for( const instance of set )
				{
					out.add( instance );
				}
			}

			return out;
		}

		private _where( key_value: any ): Set<InstanceType> | undefined
		{
			return this.lut.get( key_value );
		}
		where( key_value: any ): Array<InstanceType>
		{
			return Array.from( this._where( key_value ) ?? [] );
		}

		put( key_value: any, instance: InstanceType )
		{
			let set = this._where( key_value );
			if ( set === undefined ) {
				set = new Set<InstanceType>();
				this.lut.set( key_value, set );
			}

			set.add( instance );
		}

		delete( key_value: any, instance: InstanceType )
		{
			let set = this._where( key_value );
			if ( set === undefined ) return;
			set.delete( instance );
		}

		has( key_value: any ): boolean
		{
			return this.lut.has( key_value ) && (this._where( key_value ) as Set<InstanceType>).size > 0;
		}
	}

	export class PrimaryKeyIndex<InstanceType extends object>
	{
		private lut: Map<any, InstanceType> = new Map();
		
		public get instances(): Array<InstanceType>
		{
			return Array.from( this.lut.values() );
		}

		where( key_value: any): InstanceType | undefined
		{
			return this.lut.get( key_value );
		}

		put( key_value: any, instance: InstanceType )
		{
			this.lut.set( key_value, instance );
		}

		delete( key_value: any )
		{
			this.lut.delete( key_value );
		}
		
		has( key_value: any ): boolean
		{
			return this.lut.has( key_value );
		}
	}

	export class TypeDatabase<InstanceType extends object>
	{
		private readonly pk: string|symbol;
		private readonly type: Constructor<InstanceType>;
		private indexes: Map<string|symbol, PrimaryKeyIndex<InstanceType> | Index<InstanceType>> = new Map();
		
		byKey( key_identifier: string|symbol ): Index<InstanceType>
		{
			if ( key_identifier === this.pk ) throw new Error(`${key_identifier.toString()} is a primary key. Use \`byPrimaryKey\` instead` );

			if ( !this.indexes.has(key_identifier) ) throw new DatabaseConfigurationError( `Type<${this.type.name}> had no index for key: ${key_identifier.toString()}` );
			return this.indexes.get( key_identifier ) as Index<InstanceType>;
		}

		byPrimaryKey(): PrimaryKeyIndex<InstanceType>
		{
			if ( this.pk === undefined || !this.indexes.has( this.pk ) ) throw new DatabaseConfigurationError( `Type<${this.type.name}> had no index for it's primary key: ${this.pk.toString()}` );
			return this.indexes.get( this.pk ) as PrimaryKeyIndex<InstanceType>;
		}

		addPrimaryKey()
		{
			if ( this.indexes.has( this.pk ) ) return; // Nothing to add if it's already added
			this.indexes.set( this.pk, new PrimaryKeyIndex<InstanceType>() );
		}

		addKey( key_identifier: string|symbol )
		{
			if ( this.indexes.has( key_identifier ) ) return; // Nothing to add if it's already added
			this.indexes.set( key_identifier, new Index<InstanceType>() );
		}

		constructor( type: Constructor<InstanceType> )
		{
			this.type	= type;
			this.pk		= Reflect.get( this.type.prototype, PrimaryKeyIdentifierLookup, this.type.prototype );
		}
	}

	// Symbols
	const KeyIdentifierListLookup:		unique symbol = Symbol( "@Database::KeyIdentifierList" );
	const PrimaryKeyIdentifierLookup:	unique symbol = Symbol( "@Database::PrimaryKeyIdentifier" );
	const DatabaseSymbol:				unique symbol = Symbol( "@Database::DatabaseSymbol" );

	export function Manage<T extends any>( base_class: Constructor<T> ): any
	{
		// Property decorators execute before this so all of that data is available here
		const prototype = base_class.prototype;

		const pk_id = Reflect.get( prototype, PrimaryKeyIdentifierLookup	);
		const keys	= Reflect.get( prototype, KeyIdentifierListLookup		) ?? [];
		const db = new TypeDatabase( base_class );
		db.addPrimaryKey();
		for ( const key of keys )
		{
			db.addKey( key );
		}

		Reflect.set( prototype, DatabaseSymbol, db );
		const preserved_base = Reflection.PreserveMetadata( base_class as _ctor )

		// We mutate the class, so ensure we're preserving the metadata of the original
		return class extends preserved_base {
			constructor( ...args: any[] )
			{
				super( ...args );

				// If this primary key is already in use, return that instance instead
				const pk_val = Reflect.get( this, pk_id );
				if ( pk_val !== undefined && db.byPrimaryKey().has( pk_val ) )
				{
					return db.byPrimaryKey().where( pk_val ) as ThisType<T>;
				}

				// Note: Proxy is used here as it's a fully supported method of trapping attempts to "set" properties of this instance.
				// Attempting to do this by replacing the property descriptor for our keys is fraught with edge cases and stack overflow
				// issues. By using a Proxy we relinquish a bit of OOP visibility (as Proxies appear as a non class type in logging), but
				// in exchange, we get an easier and more reliable way to see when the properties we care about change.

				// Return a Proxy which traps attempts to change our key's values so we can update our LUT
				const proxy = new Proxy( this, {
					set: ( t, p, v, r ) => {
						const curVal = Reflect.get( t, p, r );
						
						if ( p === pk_id )
						{
							db.byPrimaryKey().delete( curVal );
							db.byPrimaryKey().put( v, proxy );
						}
						else
						{
							db.byKey( p ).delete( curVal, proxy );
							db.byKey( p ).put( v, proxy );
						}

						return Reflect.set( t, p, v, r );
					}
				} );

				// Cache the proxy in the database under it's primary key
				if ( pk_id && pk_val )
				{
					db.byPrimaryKey().put( pk_val, proxy );
				}

				// Cache the proxy in the database under it's keys
				for( const key of keys )
				{
					const key_value = Reflect.get( proxy, key, proxy );
					db.byKey( key ).put( key_value, proxy );
				}

				return proxy;
			}
		}
	}

	export function Key<T extends object>( key_name?: string|symbol )
	{
		return function ( target: T, prop: string|symbol, descriptor?: TypedPropertyDescriptor<any> )
		{
			const key_list = (Reflect.get( target, KeyIdentifierListLookup ) ?? new Set()) as Set<string|symbol>;
			key_list.add( prop )
			Reflect.set( target, KeyIdentifierListLookup, key_list );
		}
	}

	export function PrimaryKey<T extends object>( target: T, prop: string|symbol )
	{
		Reflect.set( target, PrimaryKeyIdentifierLookup, prop );
	}

	export function get<T extends object>( type: Constructor<T> ): TypeDatabase<T>
	{
		const prototype: T = type.prototype;
		if ( !Reflect.has( prototype, DatabaseSymbol ) )
		{
			Reflect.set( prototype, DatabaseSymbol, new TypeDatabase<T>( type ) );
		}
		return Reflect.get( prototype, DatabaseSymbol ) as TypeDatabase<T>;
	}
}