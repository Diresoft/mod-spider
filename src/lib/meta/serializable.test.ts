import { describe, it, expect, beforeEach, vitest } from 'vitest';
import { get } from 'svelte/store';
import { Uuid } from '$lib/Uuid';
import { Serializable } from './serializable';
import type { JsonObject, JsonType } from '$lib/util/types';

describe.skip( '@Serializable', () => {

	it( 'completes a round trip for types without a toJSON defined', () => {
		@Serializable
		class Foo {
			public a: string = "a";
			public b: number = -1;
			public c: boolean = false;
			public d: object = { bar: "bar" }

			private pr_a: string = "pr_a";
			private pr_b: number = -2;
			private pr_c: boolean = false;
			private pr_d: object = { private_bar: "private_bar" };
		}

		const original = new Foo();
		original.a = crypto.randomUUID();
		//@ts-expect-error accessing a private method for testing.
		original.pr_a = crypto.randomUUID();

		const original_serialized = Serializable.toJSON( original );
		const original_deserialized = Serializable.fromJSON( original_serialized );

		expect( original ).toMatchObject( original_deserialized );
	})

	it( 'completes a round trip for types with a toJSON defined', () => {
		@Serializable
		class Foo {
			public a: string = "a";
			public b: number = -1;
			public c: boolean = false;
			public d = { bar: "bar" }

			private pr_a: string = "pr_a";
			private pr_b: number = -2;
			private pr_c: boolean = false;
			private pr_d = { private_bar: "private_bar" };

			toJSON() {
				this.b = 42;
				this.pr_b = 42;
				this.d.bar = "foo";
				this.pr_d.private_bar = "foo";

				return this;
			}
		}

		const original = new Foo();
		original.a = crypto.randomUUID();
		//@ts-expect-error accessing a private method for testing.
		original.pr_a = crypto.randomUUID();

		const original_serialized = Serializable.toJSON( original );
		const original_deserialized = Serializable.fromJSON<Foo>( original_serialized );

		expect( original ).toMatchObject( original_deserialized );
		expect( original.b ).toEqual( original_deserialized.b );
		//@ts-expect-error accessing a private method for testing.
		expect( original.pr_b ).toEqual( original_deserialized.pr_b );
		expect( original.d ).toMatchObject( original_deserialized.d );
		//@ts-expect-error accessing a private method for testing.
		expect( original.pr_d ).toMatchObject( original_deserialized.pr_d );
	})

	it( 'completes a round trip for types with @Serializable sub-objects', ()=>{
		class Foo {
			public fiz: string = "fiz"
		}
		class Bar {
			public biz: string = "biz"
			public baz: Foo = new Foo();
		}

		const original = new Bar();
		original.biz = "bez";
		original.baz.fiz = "faz";

		const original_serialized	= Serializable.toJSON		( original			  );
		const original_deserialized	= Serializable.fromJSON<Bar>( original_serialized );

		expect( original_deserialized ).toMatchObject( original );
	})

	it( 'doesn\'t modify the prototype during serialization', () => {
		class Foo {
			public a: string = "a";
			protected b: string = "b";
			private c: string = "c";

			constructor( fiz: string = "fiz" )
			{
				this.a = fiz;
			}

			Bar() {
				this.b = "bar";
			}

			toJSON() {
				this.c = "car";
				return this;
			}
		}
		const original_toJSON = Foo.prototype.toJSON;
		const original = new Foo();
		original.Bar();

		const original_serialized = Serializable.toJSON( original );
		const original_deserialized = Serializable.fromJSON<Foo>( original_serialized );

		expect( original ).toMatchObject( original_deserialized );
		expect( original_toJSON ).toEqual( Foo.prototype.toJSON );
		
	})

	it( 'completes a round trip for Uuid\'s without losing reference equality', () => {
		const original = Uuid.Create();

		const original_serialized = Serializable.toJSON( original );
		expect( original_serialized ).toEqual( `{"@@type":"Uuid","@@value":"${original.value}"}`)

		const original_deserialized = Serializable.fromJSON( original_serialized );
		expect( original_deserialized ).toEqual( original );
	})

	it( 'completes a round trip for classes with a static fromJSON method defined', () => {
		const uuid_on_revive = crypto.randomUUID();

		@Serializable
		class Foo {
			public readonly value;

			static fromJSON( v: JsonObject<Foo> )
			{
				return new Foo(uuid_on_revive);
			}
			toJSON()
			{
				return "stripped"
			}
			constructor( value: string = crypto.randomUUID() )
			{
				this.value = value;
			}
		}

		const original = new Foo();
		const serialized = Serializable.toJSON( original );
		expect( serialized ).toEqual(`{"@@type":"Foo","@@value":"stripped"}`)
		const deserialized = Serializable.fromJSON<Foo>( serialized );
		expect( deserialized.value ).toEqual( uuid_on_revive );
	})

	it( 'completes a round trip on a class who\'s parent is also serializable', ()=>{
		const uuid_on_revive = crypto.randomUUID();
		const uuid_on_revive2 = crypto.randomUUID();
		@Serializable
		class Foo {
			public readonly value;
			public static [Serializable.constructor]( d: JsonType<Foo> )
			{
				return new Foo( uuid_on_revive );
			}
			constructor( value: string = crypto.randomUUID() )
			{
				this.value = value;
			}
		}

		@Serializable
		class Bar extends Foo {
			public readonly bar_value;
			public static [Serializable.constructor]( d: JsonType<Foo> )
			{
				return new Foo( uuid_on_revive2 );
			}
			constructor( value: string = crypto.randomUUID() )
			{
				super();
				this.bar_value = value;
			}
		}

		const original = new Bar();
		const serialized = Serializable.toJSON( original );
		const deserialized = Serializable.fromJSON<Bar>( serialized );

		expect( deserialized.bar_value ).toEqual( uuid_on_revive2 );
		//expect( deserialized.value ).toEqual( uuid_on_revive ); // The last type hydrator in the parent chain is the only one which applies.
		expect( deserialized.constructor ).toEqual( Bar );
	})
})