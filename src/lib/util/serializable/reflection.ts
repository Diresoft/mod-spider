import { NonReflectedTypeError, _own_class } from "./decorators";
import type { Constructor } from "../types";

export function GetClassOf<T extends Constructor>( target : InstanceType<T> )
{
	if ( !( _own_class in target.prototype ) ) throw new NonReflectedTypeError( target.prototype );
	return target.prototype[ _own_class ];
}