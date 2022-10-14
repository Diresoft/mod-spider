import { make_primitive_serializable, type JsonType } from "./decorators";


// MAP
make_primitive_serializable(
	Map.prototype
  , function toJSON() {
	  return Array.from( this.entries() );
  }
  , function type_hydrator( d : JsonType ) {
	  return new Map( d as Iterable<never> );
  }
);