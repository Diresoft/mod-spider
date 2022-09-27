import type { SvelteComponent } from "svelte";

export class ModalManager {
	private static _singleton : ModalManager;
	
	private m_activeModal : SvelteComponent;
	private m_container : HTMLElement;

	constructor() {
		if ( !(ModalManager._singleton instanceof ModalManager) ) 
		{	// Create the instance if we need it
			ModalManager._singleton = this;
		}
		return ModalManager._singleton // Always return the singleton instance instead of a new instance
	}

	public Open( modal )
	{
		
	}
}