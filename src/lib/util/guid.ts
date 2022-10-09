import { Serializable } from "./serializable";

@Serializable()
export class Guid {
	
	private readonly _guid_string = Guid._generate_guid_string();
	private test : string = "nada";

	private static _generate_guid_string() : string
	{
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	public static hydrate( guid : string ) : Guid
	{
		return Object.create( new Guid(), {
			_guid_string: { value: guid }
		}) as Guid
	}
	
	toString()
	{
		Object.assign( this, { _guid_string: "ASDF" } );
		return this._guid_string;
	}

	toJSON()
	{
		return this._guid_string;
	}
}
