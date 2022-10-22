import { NonReflectedTypeError, _own_class } from "./serialization_decorators";
import type { Constructor } from "../util/types";

export function GetClassOf<T extends Constructor>( target : InstanceType<T> )
{
	if ( !( _own_class in target.prototype ) ) throw new NonReflectedTypeError( target.prototype );
	return target.prototype[ _own_class ];
}