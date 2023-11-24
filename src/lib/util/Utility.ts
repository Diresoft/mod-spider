export function sleep( millis: number ): Promise<void> {
    const uuid = crypto.randomUUID();
    console.warn    ( `SLEEP<${uuid}> START`, `${millis}ms\n`, (new Error()).stack );
    return new Promise( res => setTimeout( () => {
        console.warn( `SLEEP<${uuid}> END`, `${millis}ms\n` );
        res();
    }, millis ));
}