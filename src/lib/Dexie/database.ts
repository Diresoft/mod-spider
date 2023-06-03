// db.ts
import Dexie, { type Table } from 'dexie';
import { Plan } from '../app/plan/Plan';
import { ModGroup } from '../app/plan/ModGroup';
import { DexieUtils } from './DexieUtils';

export class ModSpiderDatabase extends Dexie
{
	plans      !: Table<Plan>;
	mod_groups !: Table<ModGroup>;

	constructor() {
		// Database name
		super( 'mod_spider' );
		
		// Specify the stores
		this.version(1).stores({
			plans:		'&id',
			mod_groups: '&id'
		});

		// Map the top level class types to each table
		this.plans	   .mapToClass( Plan     );
		this.mod_groups.mapToClass( ModGroup );

		// Configure this db to use our middleware
		DexieUtils.ConfigureMiddleware( this );
	}
}
export const db = new ModSpiderDatabase();
//DexieUtils.HACK_ConstructType_RangeSet( db, db.plans, { id: crypto.randomUUID() } );