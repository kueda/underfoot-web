import { useEffect, useState } from 'react';
import localforage from 'localforage';
import jszip from 'jszip';

export interface UnzippedPackData {
  context?: Blob,
  contours?: Blob,
  rocks?: Blob,
  water?: Blob,
  ways?: Blob
}

interface PackBoundingBox {
  bottom: number,
  left: number,
  right: number,
  top: number
}

interface PackMetadata {
  admin1: string;
  admin2: string;
  bbox: PackBoundingBox;
  description: string;
  id: string;
  name: string;
  path?: string;
  pmtiles_path?: string;
  updated_at: string;
}

export class Pack {
  admin1: string;
  admin2: string;
  bbox: PackBoundingBox;
  description: string;
  id: string;
  name: string;
  path?: string;
  pmtilesPath?: string;
  updatedAt: string;
  zippedData?: Blob;

  constructor(metadata: PackMetadata, data?: Blob) {
    this.admin1 = metadata.admin1;
    this.admin2 = metadata.admin2;
    this.bbox = metadata.bbox;
    this.description = metadata.description;
    this.id = metadata.id;
    this.name = metadata.name;
    this.pmtilesPath = metadata.pmtiles_path;
    this.updatedAt = metadata.updated_at;
    this.zippedData = data;
  }

  static fromPack(pack: Pack): Pack {
    return new Pack(
      {
        admin1: pack.admin1,
        admin2: pack.admin2,
        bbox: pack.bbox,
        description: pack.description,
        id: pack.id,
        name: pack.name,
        path: pack.path,
        pmtiles_path: pack.pmtilesPath,
        updated_at: pack.updatedAt,
      },
      pack.zippedData
    );
  }

  async unzippedData(): Promise<UnzippedPackData> {
    let zip: jszip;
    try {
      zip = await jszip.loadAsync( this.zippedData );
    } catch ( loadAsyncErr ) {
      console.error( "failed to load zip: ", loadAsyncErr );
      return {};
    }
    const unzipped: UnzippedPackData = {};
    const zipPaths: string[] = [];
    zip.forEach( path => zipPaths.push( path ) );
    await Promise.all( zipPaths.map( async path => {
      const key = path.split( "/" ).pop( )?.replace( /\..+$/, "" );
      if ( !key || !zip.file( path ) || zip.file( path )?.dir ) return;
      const data = await zip.file( path )?.async( "blob" );
      if (!data) return;
      switch ( key ) {
      case 'rocks':
        unzipped.rocks = data;
        break;
      case 'water':
        unzipped.water = data;
        break;
      case 'ways':
        unzipped.ways = data;
        break;
      case 'contours':
        unzipped.contours = data;
        break;
      case 'context':
        unzipped.context = data;
        break;
      }
    } ) );
    return unzipped;
  }
}

interface RemoteManifest {
  packs: PackMetadata[],
  updated_at: string
}

class Manifest {
  packs: Pack[];
  updatedAt: Date;

  constructor(json: RemoteManifest) {
    this.packs = json.packs.map(remotePack => new Pack(remotePack));
    this.updatedAt = new Date(json.updated_at);
  }
}

interface DownloadOptions {
  onProgress?: (value: { loadedBytes: number, totalBytes: number }) => void;
  signal?: AbortSignal;
}

export interface PackStore {
  currentPackId: string | null;
  download: (packId: string, options?: DownloadOptions) => Promise<void>;
  get: (packId: string) => Promise<Pack | undefined>;
  getCurrentPackId: ( ) => Promise<string | null>;
  list: ( ) => Promise<Pack[]>;
  listLocal: ( ) => Promise<Pack[]>;
  manifest: Manifest | undefined;
  remove: (packId: string) => Promise<void>;
  setCurrent: (packId: string) => void;
  error: Error | null;
}

const packStore = localforage.createInstance({ name: 'packStore' });
const prefStore = localforage.createInstance({ name: 'prefStore' });

export function usePackStore( ): PackStore {
  const [manifest, setManifest] = useState<Manifest | undefined>( undefined );
  const [currentPackId, _setCurrentPackId] = useState<string | null>( null );
  const [error, setError] = useState<Error | null>(null);

  useEffect( () => {
    prefStore.getItem<string>("currentPackId")
      .then(_setCurrentPackId)
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

  async function getCurrentPackId() {
    return prefStore.getItem<string>("currentPackId");
  }

  async function get(packId: string): Promise<Pack | undefined> {
    const storedPack = await packStore.getItem<Pack>(packId);
    if ( storedPack ) {
      // Instantiate a full Pack object so we have all the instance methods
      return Pack.fromPack(storedPack);
    }
    return manifest?.packs.find((pack: Pack) => pack.id === packId);
  }

  function setCurrent(packId: string | null) {
    _setCurrentPackId(packId);
    if (packId) {
      prefStore.setItem('currentPackId', packId)
        .catch( e => console.error( 'Failed to get currentPackId: ', e));
    } else {
      prefStore.removeItem('currentPackId')
        .catch(e => console.error('Failed to remove currentPackId: ', e));
    }
  }

  async function list() {
    const manifestPacks = manifest?.packs;
    let packs: (Pack | undefined)[] = []
    if (manifestPacks) {
      packs = await Promise.all(manifestPacks.filter(pack => pack.pmtilesPath).map(pack => get(pack.id)));
    }
    if (packs.length === 0) {
      packs = await listLocal();
    }
    return packs.flat() as Pack[];
  }

  async function listLocal() {
    const localPackIds = await packStore.keys();
    const localPacks = await Promise.all(localPackIds.map(packId => get(packId)));
    return localPacks.flat() as Pack[];
  }

  async function download(packId: string, options?: DownloadOptions) {
    const opts = options || {};
    const pack = await get(packId);
    if (!pack) throw new Error("Can't unknown pack");
    const resp = await fetch( `https://static.underfoot.rocks/${pack.pmtilesPath}`, {signal: opts.signal} );

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
    if (!currentPackId) setCurrent(packId);
  }

  async function remove(packId: string) {
    await packStore.removeItem(packId);
    if (currentPackId === packId) setCurrent(null);
  }

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
