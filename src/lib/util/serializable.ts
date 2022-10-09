
// Basic JSON types
export type JsonPrimitive		= string | number | boolean | null | object | ArrayLike<JsonPrimitive>;
export type JsonObject			= Record<string, JsonPrimitive>;
export type JsonType			= JsonPrimitive | JsonObject;

// Augmented JSON types
export type DireTypedJsonObject	= { _type: string, _value: JsonObject };
export type DireJsonType		= DireTypedJsonObject | JsonPrimitive;

type _constructor<T> = new (...args: Array<unknown>) => T;
type _metadata<T extends _constructor< T > > = {
	  _class: T
	, _dehydrator: () => JsonObject | JsonPrimitive
}

const _reflection: Map<string, unknown > = new Map();

export function Serializable<T extends _constructor< T > >()
{
	return function( target : InstanceType<T> )
	{
		const type = target.name;
		const meta: _metadata<T> = {
			_class: target,
			_dehydrator: target.prototype.toJSON
		}
		_reflection.set( type, meta ); // Register the type
	}
}







// export type TypeRegistration = { _class: _constructor, hydrator: ( jsonData : JsonObject ) => unknown };

// const type_registry : Map<string, TypeRegistration> = new Map();

// function wrap_toJSON( target : _constructor )
// {
// 	const original = target.prototype.toJSON;
// 	target.prototype.toJSON = function ( this : _constructor, key : string )
// 	{
// 		return {
// 			_type:	target.name,
// 			_value:	original ? original.call(this, key) : Object.assign( {}, this )
// 		}
// 	}
// }

// // export function Serializable() {
// // 	return function ( target: Class ) {
// // 		wrap_toJSON( target );
		
// // 	}
// // }

// export function Deserializer( _ : string, target : JsonObject ) {
// 	if ( // Unsupported primitives pass through untransformed
// 		   typeof target		!== "object"	// objects are the only primitive we work with
// 		|| typeof target._type	!== "string"	// we need the _type to exist and be a string for deserializing the class
// 	) { return target; }

// 	const reflection = type_registry.get( target._type ); // metadata about the object we're deserializing
// 	if ( !reflection ) throw new TypeError( `Invalid type ${ target._type } encountered while parsing JSON` );

// 	return reflection.hydrator( target._value );
	


// 	if ( 
// 		typeof target === "object"
// 		&& target !== null
// 		&& "_type" in target
// 		&& "_value" in target
// 		&& type_registry.has( target._type )
// 	) {
// 		console.log( `Reviving with reviver:`, type_registry.get( target._type ) )
// 		const registry = type_registry.get( target._type );
// 		if ( !registry ) throw new TypeError( `Invalid Type ${ target._type } found while parsing JSON` );
// 		return registry._hydrator( target._value );
// 	}
// 	else
// 	{
// 		return target;
// 	}
// }