import { Guid } from "../util/Guid";
import { reflect, reflection, SERIALIZED_TYPE_NAME } from "./serialization_decorators";

const PRIMARY_KEY			: unique symbol = Symbol( "@Database::PRIMARY_KEY"					);
const PUT_BY_PK				: unique symbol = Symbol( "@Database::Func::PUT_BY_PK"				);
const PUT_BY_KEY			: unique symbol = Symbol( "@Database::Func::PUT_BY_KEY"				);
const UPDATE_INSTANCE_KEY_VALUE	: unique symbol = Symbol( "@Database::Func::CHANGE_INSTANCE_KEY"	);

/** Constructor Type for a concrete class with a public constructor */
type _ctor<T> = ( new ( ...args: any[] ) => T );

type LUT_InstanceTable<T extends _ctor<any>> = Map< unknown, InstanceType<T>>;
type LUT_PropertyName = string | symbol;
type LUT_PropertyTable<T extends _ctor<any>> = Map<LUT_PropertyName, LUT_InstanceTable<T>>;
class LUT<T extends _ctor<any>>
{
	public	readonly	[ PRIMARY_KEY ]	: LUT_PropertyName;
	private	readonly	_type_name		: string;
	private	readonly	_tables			: LUT_PropertyTable<T> = new Map();

	constructor( type_name: string, pkProperty: LUT_PropertyName )
	{
		this._type_name		= type_name;
		this[ PRIMARY_KEY ]	= pkProperty;
		this._tables.set( pkProperty, new Map() );
	}

	byPrimaryKey( value: unknown ): InstanceType<T> | undefined
	{
		return this.byKey( this[ PRIMARY_KEY ], value );
	}
	byKey( key: LUT_PropertyName, value: any ): InstanceType<T> | undefined
	{
		return this._tables.get( key )?.get( value );
	}

	hasByInstance( instance: InstanceType<T> ): boolean
	{
		const val = Reflect.get( instance, this[PRIMARY_KEY], instance );
		return this.hasByPrimaryKey( val );
	}
	hasByPrimaryKey( value: unknown ): boolean
	{
		return this.hasByKey( this[ PRIMARY_KEY ], value );
	}
	hasByKey( key: LUT_PropertyName, value: any ): boolean
	{
		return this._tables.get( key )?.get( value ) !== undefined ? true :  false;
	}

	[PUT_BY_PK]( instance: InstanceType<T> ): InstanceType<T>
	{
		return this[PUT_BY_KEY]( this[PRIMARY_KEY], instance );
	}

	[PUT_BY_KEY]( key: LUT_PropertyName, instance: InstanceType<T> ): InstanceType<T>
	{
		const _pkVal = Reflect.get( instance, key, instance );
		const _pkLut = this._tables.get( this[ PRIMARY_KEY ] );
		if ( _pkLut === undefined ) throw new TypeError( `LUT<${this._type_name}> is missing the Primary Key table` );
		if ( _pkLut.has( _pkVal ) )
		{	// Use the existing instance
			return _pkLut.get( _pkVal ) as InstanceType<T>;
		}
		else
		{	// Wrap the instance in a proxy
			const wrapped = new Proxy( instance, {
				get: ( target, prop, reciever ) => {
					// console.log( `Foo`, target, prop );
					return Reflect.get( target, prop, reciever );
				},
				set: ( target, prop, val ): boolean => {
					// console.log( `Bar`, target, prop, val );
					return true;
				}
			});
			_pkLut?.set( _pkVal, wrapped );
			return wrapped;
		}
	}

	// Move instance from it's old key to a new key
	[UPDATE_INSTANCE_KEY_VALUE]( key: LUT_PropertyName, old_val: unknown, new_val: unknown ): void
	{
		const table				= this._tables.get( key );
		if ( table === undefined ) throw new Error( `Key: ${key.toString()} not found in LUT<${this._type_name}> while attempting to update that key value`) 
		const instance_to_move	= table.get( old_val );
		if ( instance_to_move === undefined ) throw new Error( `The value: \`${old_val}\` does not exist as a key in LUT<${this._type_name}>::Table<${key.toString}>. Can't move as there's nothing to move` );
		if ( table.has( new_val ) )
		{
			throw new Error( `The value: \`${new_val}\` already exists as a key in LUT<${this._type_name}>::Table<${key.toString}>. Can't move as it would overwrite existing value` );
		}
		table.set( new_val, instance_to_move );
		table.delete( old_val );
	}

	remove( instanceToRemove: InstanceType<T> ): boolean
	{
		for ( const table of this._tables.values() )
		{
			for ( const [key, instance] of table )
			{
				if ( instance === instanceToRemove )
				{
					table.delete( key );
					return true;
				}
			}
		}
		return false;
	}
}

export class Database
{
	private static _luts:	Map< string, LUT<_ctor<any>> >	= new Map();
	private static getLut<T extends _ctor<any> >( base_name: string, pk_property: string | symbol | null = null ): LUT<T>
	{
		if ( !this._luts.has( base_name ) )
		{
			if ( pk_property === null ) throw new SyntaxError( `LUT<${base_name}> can't be created at this time, as no Primary Key was specified` );
			this._luts.set( base_name, new LUT<T>( base_name, pk_property ) );
		}
		return this._luts.get( base_name ) as LUT<T>;
	}

	static Manage<T extends _ctor<any> >( base_class: T ) : T
	{
		const base_name = base_class.name;
		const meta = (base_class.prototype[reflection] = reflect( base_class ));
		base_class.prototype[SERIALIZED_TYPE_NAME] = base_name;


		return class extends base_class
		{
			constructor( ...args: any[] )
			{
				super( ...args );

				// Record this class in the Rdbms, or retrieve it if one with it's PK already exists
				return Database.getLut( base_name )[PUT_BY_PK]( this );
			}
		}
	}


	public static PrimaryKey<T extends _ctor<{}>>( base_class: InstanceType<T>, prop_key: string | symbol )
	{
		const base_name = base_class.constructor.name;
		Database.getLut( base_name, prop_key ); // Ensure the PK and LUT is created
	}

	// public static Key<T extends _ctor<{}>, P>( key_name: string ): any
	// {
	// 	return function( base_class: InstanceType<T>, prop_key: string | symbol, descriptor: TypedPropertyDescriptor<P> )
	// 	{
	// 		const base_name = base_class.constructor.name;
	// 		// Wrap the setter for the property (if there is one) so that we update the LUT when the value changes
	// 		const original_setter = descriptor.set;

	// 	}
	// }

	public static Key<T extends _ctor<{}>, P>( base_class: InstanceType<T>, prop_key: string | symbol, descriptor?: PropertyDescriptor ): any
	{
		const base_name = base_class.constructor.name;
		// console.log( `${prop_key.toString()}:`, descriptor )
		// If there's no descriptor, this property is just a regular prop. If we have a descriptor we need to override the setter to track changes to
		// this property's value and update the LUTs

		const org_prop_symbol = Symbol( `@Database::Redirect::${base_name}::${prop_key.toString()}` );
		// if( descriptor === undefined )
		// {
		// 	Object.defineProperty( base_class, 'str', {
		// 		set: function( val: unknown ) { console.log( `TEST:`, val ); }
		// 	})
		// }
		// console.log( `${prop_key.toString()}:`, base_class, prop_key.toString(), Object.getOwnPropertyDescriptors( base_class ) );

	}

	public static Get<T extends _ctor<any> >( type: T ) : LUT<T>
	{
		const base_name = Object.getPrototypeOf(type).name;
		//return Database.getLut( base_name );
	}
}






// const test = new Map<any, any>();

// export class Database
// {
// 	/** Maps class name to it's primary key property symbol */
// 	private static _pk_lut: Map< string, string | symbol>					= new Map();

// 	/** Maps class name to a map from a key's user defined name to it's property symbol */
// 	private static _k_lut:  Map< string, Map< string, string | symbol > >	= new Map();

// 	/** Maps class name to a map from pk value to class instance */
// 	private static _tables: Map< string | symbol, Map< unknown, any > >	= new Map()

// 	public static Manage<T extends _ctor<{}> >( base_class: T ): T
// 	{
// 		const base_name = base_class.name;

// 		if ( !Database._tables.has( base_name ) ) Database._tables.set( base_name, new Map() );
// 		const table		= Database._tables.get( base_name ) as Map< unknown, T >; // Retrieve the LUT for this object type

// 		class RdbmsManaged extends base_class
// 		{
// 			constructor( ...args: any[] )
// 			{
// 				super( ...args );
// 				// This is a "Runtime" database system. When instantiating classes managed by it we want to track them
// 				// so we don't end up with duplicates, and we can easily retrieve a reference to them elsewhere.

// 				const pkProp	= Database._pk_lut.get( base_name ); // Determine what the primary key property is for this class type
// 				if ( pkProp === undefined ) throw new SyntaxError( `Type \`${base_name}\` has no property marked as a Primary Key. The RDBMS can not manage this type` );
// 				const pkVal		= Reflect.get( this, pkProp, this ); // Retrieve the _value_ of that primary key
// 				if ( !table.has( pkVal ) )
// 				{
// 					table.set( pkVal, this as unknown as T );
// 				}
// 				return table.get( pkVal ) as T; // We just ensured this entry existed
// 			}
// 		}

// 		test.set( RdbmsManaged, base_name );

// 		return RdbmsManaged;
// 	}

// 	public static PrimaryKey<T extends _ctor<{}>>( base_class: InstanceType<T>, prop_key: string | symbol )
// 	{
// 		const base_name = base_class.constructor.name;
// 		Database._pk_lut.set( base_name, prop_key );
// 	}

// 	public static Key( key_name: string )
// 	{
// 		return function<T extends _ctor<{}>>( base_class: InstanceType<T>, prop_key: string | symbol )
// 		{
// 			const base_name = base_class.constructor.name;
// 			if ( !Database._k_lut.has( base_name ) )
// 			{
// 				Database._k_lut.set( base_name, new Map() );
// 			}
// 			Database._k_lut.get( base_name )?.set( key_name, prop_key );
// 		}
// 	}

// 	public static Get<T>( type: T ) : LUT<T>
// 	{
// 		console.log( test, test.get(type) )

// 	}
// }

// type _ctor<T> = ( new ( ...args: any[] ) => T );

// type type_database<T extends _ctor<{}> > = {
// 	  TypeName:		string
// 	, Type:			T
// 	, PrimaryKey:	null | string | symbol
// 	, LUTs:			Map< string | symbol, Map< unknown, T >> // For each property marked as a key, store a Map between that property's value and 
// }

// export class NonDBMSTypeError extends TypeError
// {
// 	public readonly type_name: string;
// 	constructor( type_name: string )
// 	{
// 		super( `Type \`${type_name}\` is probably missing a @Database decorator` );
// 		this.type_name = type_name;
// 	}
// }

// const _dbms: Map<string, type_database<_ctor<{}>>> = new Map();
// function getDbInstance<T extends _ctor<{}>>( incident: T | string ): type_database<T>
// {
// 	const incident_type_name = typeof incident === 'string' ? incident : incident.name;
// 	if ( !_dbms.has( incident_type_name ) )
// 	{
// 		if ( typeof incident === 'string' ) throw new NonDBMSTypeError( incident_type_name );
// 		const out = {
// 			  TypeName:		incident_type_name
// 			, Type:			incident
// 			, PrimaryKey:	null
// 			, LUTs:		new Map()	// Track all instances of this type using an unknown type of primary key
// 		}
// 		_dbms.set( incident_type_name, out );
// 		return out;
// 	}
// 	else
// 	{
// 		return _dbms.get( incident_type_name ) as type_database<T>;
// 	}
// }

// export function Database<T extends _ctor<{}> >( base_class: T ): T
// {
// 	const meta = ( base_class.prototype[_database] = getDbInstance( base_class ) );

// 	return class extends base_class
// 	{
// 		constructor( ...args: any[] )
// 		{
// 			super( ...args );
// 			if ( meta.PrimaryKey === null ) throw new SyntaxError( `Failed to apply @Database to \`${base_class.name}\`. No Primary key assigned` );

// 			const _pkLUT	= meta.LUTs.get( meta.PrimaryKey );
// 			const _pkVal	= Reflect.get( this, meta.PrimaryKey, this );
// 			if ( _pkLUT === undefined ) throw new SyntaxError( `Malformed Primary Key for \`${base_class.name}\`. No LUT exists for '${meta.PrimaryKey.toString()}'` );
			
// 			if ( !_pkLUT.has( _pkVal ) )
// 			{
// 				_pkLUT.set( _pkVal, this as unknown as T);
// 			}
// 			return _pkLUT.get( _pkVal ) as T; // We ensured it was in the lut just before this
// 		}

// 	}
// }

// export function Database_PrimaryKey<T extends _ctor<{}>>( base_class: InstanceType<T>, prop_key: string | symbol )
// {
// 	const meta = getDbInstance( base_class.constructor as T );
// 	meta.PrimaryKey = prop_key;
// 	meta.LUTs.set( meta.PrimaryKey, new Map() );
// }

