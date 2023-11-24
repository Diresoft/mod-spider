import type { DialogFilter } from "@tauri-apps/api/dialog";
import { open } from '@tauri-apps/api/dialog';
import { copyFile, createDir } from "@tauri-apps/api/fs";
import { BaseDirectory, appDataDir, dirname, extname, join } from "@tauri-apps/api/path";

const temp_file_name = `!!___TEMPFILE`; // This is constant since we can only be opening a single file to temp at a time, and they don't get automatically cleaned up

/**
 * Presents the file open dialog, but rather than returning the original file path it will copy the
 * file selected to a temporary location in the application data dir and return that file path instead.
 * If `out_path` is specified, it will be used as a relative location under the application data dir.
 * @param out_path Where to put the file after opening. Do not include the file extension, as it will 
 * be set to match the selected file
 * @param filters Dialog filters for the open command
 */
export async function openToTempFile( out_path?: string, filters?: DialogFilter[] ): Promise<string|false> {

    // Select the file
    const selected = await open ({ multiple: false, filters } );

    // Validate the selection
    if( selected === null ) return false; // No file was selected
    if( Array.isArray( selected ) ) throw new Error( `Invalid multiple selection` );

    // Determine where we're copying the file to
    const app_data_dir = await appDataDir();
    const extension    = await extname( selected );
    let tmp_path: string;
    if ( out_path ) {
        tmp_path = await join( app_data_dir, `${out_path}.${extension}` );
    } else {
        tmp_path = await join( app_data_dir, `temp`, `${temp_file_name}.${extension}` );
    }

    // Ensure the target directory exists
    try {
        await createDir( await dirname( tmp_path ), { dir: BaseDirectory.AppData, recursive: true } );
    } catch( e ){
        throw e; // TODO: What are the error types this function returns?
    };

    // Copy the file to the target directory
    await copyFile( selected, tmp_path, { dir: BaseDirectory.AppData } );

    // File has been copied to the temp path, and we'll use that version as the "selection" instead
    return tmp_path;
}