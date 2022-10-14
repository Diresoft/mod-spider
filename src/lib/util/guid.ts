import { NoAutoHydrator, Serializable, TypeHydrator, type Dehydrated } from "./serializable/decorators";

@Serializable
@NoAutoHydrator
export class Guid {
	private readonly _guid_string = Guid._generate_guid_string();
	private static _generate_guid_string() : string
	{
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
	
	@TypeHydrator
	static _hydrator( d : Dehydrated<Guid> ) {
		return Object.assign( new Guid(), d );
	}
}
