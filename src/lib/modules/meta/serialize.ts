import type { _ctor, _private_ctor, _protected_ctor } from "../util/types";

export function Serializable_PrivateClass<T extends _private_ctor>( class_constructor: T )
{
	return Serializable( class_constructor as unknown as _ctor );
}
export function Serializable_ProtectedClass<T extends _protected_ctor>( class_constructor: T )
{
	return Serializable( class_constructor as unknown as _ctor );
}
export function Serializable<T extends _ctor>( class_constructor: T )
{
	
}
