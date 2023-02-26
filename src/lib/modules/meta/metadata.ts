import type { _ctor_any } from "../util/types";

export type ClassType<T> = new(...args:any[]) => T;
export type DesignInfo<T> = {
	TypeName: string,
	Constructor: ClassType<T>
}

export class Metadata {
	private static readonly DesignInfo: unique symbol = Symbol( "@Reflection::DesignInfo" );

	public static Get<T extends object>( target: T ): DesignInfo<T>
	{
		if ( !Reflect.has( target, Metadata.DesignInfo ) )
		{	// Haven't already embedded metadata for this class. Embed it now
			Metadata.PreserveMetadata( target.constructor as ClassType<T> );
		}
		return Reflect.get( target, Metadata.DesignInfo ) as DesignInfo<T>;
	}

	public static PreserveMetadata< T >( base_class: _ctor_any | ClassType<T> ): _ctor_any
	{
		// If we already have metadata do nothing
		if ( Reflect.has( base_class.prototype, Metadata.DesignInfo ) ) return base_class;

		const meta: DesignInfo<T> = {
			TypeName:		base_class.name,
			Constructor:	base_class as ClassType<T>
		}
		Reflect.set( base_class.prototype, Metadata.DesignInfo, meta );
	
		return base_class; // Simply return the original type for usage
	}
}
