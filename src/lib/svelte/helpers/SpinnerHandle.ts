import type { Readable, Subscriber, Unsubscriber } from "svelte/store";

export enum SpinnerState {
    NotStarted,
    Running,
    CrossVisible,
    CheckmarkVisible,
    Complete
}
export type SpinnerOptions = {
    delay       : number,
    show_result : boolean
}
export class SpinnerHandle implements Readable<Readonly<SpinnerHandle>>
{
    // Readable Implementation
    protected subscribers: Set<Subscriber<Readonly<SpinnerHandle>>> = new Set();
    protected notify() { this.subscribers.forEach( cb => cb( this ) ) }
    public subscribe( run: Subscriber<Readonly<SpinnerHandle>> ): Unsubscriber {
        this.subscribers.add( run );
        run( this );
        return () => { this.subscribers.delete( run ) };
    }

    // SpinnerHandle Implementation
    public readonly end_delay_ms !: number;
    public readonly show_result  !: boolean;

    public get running(): boolean {
        return this.state > SpinnerState.NotStarted && this.state < SpinnerState.Complete;
    }

    protected pending_waits: number  = 0;
    public state: SpinnerState = SpinnerState.NotStarted;
    public get finished_promise(): Promise<void> {
        let r: ()=> void;
        const p = new Promise<void>( res => r = res );
        const u = this.subscribe( async sh => {
            if( !sh.running ) r();
            await new Promise<void>( res => res() ); // Delay a microtick to ensure `u` has been set by the time we're called
            u();
        });
        return p;
    }

    public constructor( opts: Partial<SpinnerOptions> = {} ) {
        this.end_delay_ms = opts.delay       ?? 1000;
        this.show_result  = opts.show_result ?? true;
    }

    protected onFinisherComplete()
    {
        // If we're still in the checkmark visible state, we can end it now
        if ( this.state === SpinnerState.CheckmarkVisible || this.state === SpinnerState.CrossVisible )
        {
            this.state = SpinnerState.Complete;
            this.notify();
        }
    }
    protected onWaitForComplete()
    {
        --this.pending_waits; // Always decrement the counter when a task finishes
        if( this.pending_waits <= 0 && this.show_result) {
            // No more tasks right now, move to the next stage
            this.state = SpinnerState.CheckmarkVisible;
            setTimeout( () => { this.onFinisherComplete() }, this.end_delay_ms );
        }
        else
        {
            this.state = SpinnerState.Complete;
        }
        this.notify();
    }
    protected onWaitForFailed()
    {
        --this.pending_waits; // Always decrement the counter when a task finishes
        if( this.pending_waits <= 0 && this.show_result) {
            // No more tasks right now, move to the next stage
            this.state = SpinnerState.CrossVisible;
            setTimeout( () => { this.onFinisherComplete() }, this.end_delay_ms );
        }
        else
        {
            this.state = SpinnerState.Complete;
        }
        this.notify();
    }
    public waitFor( promise: Promise<any> )
    {
        ++this.pending_waits;
        this.state = SpinnerState.Running;
        this.notify();
        promise.then( () => {
            this.onWaitForComplete();
        })
        .catch( ( e ) => {
            this.onWaitForFailed();
            throw e; // Re-throw the error for the caller to handle
        });
        return promise;
    }
}

// /** A globally accessible spinner to block the main content pane in the app */
export let ScreenBlockingSpinner = new SpinnerHandle({ show_result: false });