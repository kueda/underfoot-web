import { useCallback, useEffect, useState } from 'react';
import localforage from 'localforage';

import { Manifest } from './Manifest';
import { DownloadOptions, PackStore, RemoteManifest } from './types';
import { Pack } from "./Pack";

const packStore = localforage.createInstance({ name: 'packStore' });
const prefStore = localforage.createInstance({ name: 'prefStore' });

export function usePackStore( ): PackStore {
  const [manifest, setManifest] = useState<Manifest | undefined>( undefined );
  const [currentPackId, setCurrentPackId] = useState<string | null>( null );
  const [error, setError] = useState<Error | null>(null);

  useEffect( () => {
    prefStore.getItem<string>("currentPackId")
      .then(setCurrentPackId)
      .catch(e => console.error("Failed to get currentPackId: ", e))
  }, []);

  useEffect( ( ) => {
    fetch( "https://static.underfoot.rocks/manifest.json" )
      .then( r => r.json( ) )
      .then( (json: RemoteManifest) => setManifest(new Manifest(json)) )
      .catch((err: Error) => {
        console.error( "[ERROR] oh no!: ", err );
        setError(err);
      })
  }, [] );

  const getCurrentPackId = useCallback(async () => prefStore.getItem<string>("currentPackId"), [] );

  const get = useCallback(async (packId: string): Promise<Pack | undefined> => {
    const storedPack = await packStore.getItem<Pack>(packId);
    if ( storedPack ) {
      // Instantiate a full Pack object so we have all the instance methods
      return Pack.fromPack(storedPack);
    }
    return manifest?.packs.find((pack: Pack) => pack.id === packId);
  }, [manifest]);

  const setCurrent = useCallback((packId: string | null) => {
    setCurrentPackId(packId);
    if (packId) {
      prefStore.setItem('currentPackId', packId)
        .catch( e => console.error( 'Failed to get currentPackId: ', e));
    } else {
      prefStore.removeItem('currentPackId')
        .catch(e => console.error('Failed to remove currentPackId: ', e));
    }
  }, []);

  const listLocal = useCallback(async () => {
    const localPackIds = await packStore.keys();
    const localPacks = await Promise.all(localPackIds.map(packId => get(packId)));
    return localPacks.flat() as Pack[];
  }, [get]);

  const list = useCallback( async () => {
    const manifestPacks = manifest?.packs;
    let packs: (Pack | undefined)[] = []
    if (manifestPacks) {
      packs = await Promise.all(manifestPacks.filter(pack => pack.pmtilesPath).map(pack => get(pack.id)));
    }
    if (packs.length === 0) {
      packs = await listLocal();
    }
    return packs.flat() as Pack[];
  }, [get, listLocal, manifest]);

  const download = useCallback(async (packId: string, options?: DownloadOptions) => {
    const opts = options || {};
    const pack = await get(packId);
    if (!pack) throw new Error("Can't unknown pack");
    const url = `https://static.underfoot.rocks/${pack.pmtilesPath}`;
    const resp = await fetch(url, {signal: opts.signal});

    // Start chunked download with progress, based on https://javascript.info/fetch-progress
    const reader = resp?.body?.getReader();
    if (!reader) throw new Error(`Could not download pack: ${packId}`);
    const contentLength = resp?.headers?.get('Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
    let receivedLength = 0;
    const chunks = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      receivedLength += value.length;
      if (totalBytes && typeof (opts.onProgress) === 'function') {
        opts.onProgress({loadedBytes: receivedLength, totalBytes});
      }
    }
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for(const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }
    const blob = new Blob([chunksAll]);

    // Create a pack object with that blob
    const storedPack = new Pack({
      admin1: pack.admin1,
      admin2: pack.admin2,
      bbox: pack.bbox,
      description: pack.description,
      id: pack.id,
      name: pack.name,
      updated_at: pack.updatedAt,
    }, blob);
    // Save that pack to disk
    await packStore.setItem(packId, storedPack);
    if (!currentPackId) {
      setCurrent(packId);
    }
  }, [currentPackId, get, setCurrent] );

  const remove = useCallback( async (packId: string) => {
    await packStore.removeItem(packId);
    if (currentPackId === packId) setCurrent(null);
  }, [currentPackId, setCurrent] );

  return {
    currentPackId,
    download,
    error,
    get,
    getCurrentPackId,
    list,
    listLocal,
    manifest,
    remove,
    setCurrent,
  };
}
