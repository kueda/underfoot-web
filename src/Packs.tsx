import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import IconButton from '@mui/material/IconButton';
import jszip from 'jszip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import localforage from 'localforage';
import prettyBytes from 'pretty-bytes';
import Toolbar from '@mui/material/Toolbar';
import Radio from '@mui/material/Radio';
import { useEffect, useState } from 'react';

interface PacksProps {
  onClose: () => void
}

interface Pack {
  context?: Blob,
  contours?: Blob,
  rocks?: Blob,
  water?: Blob,
  ways?: Blob
}

interface ManifestPack {
  admin1: string,
  admin2: string,
  bbox: { bottom: number, left: number, right: number, top: number },
  description: string,
  id: string,
  name: string,
  path: string,
  pmtiles_path?: string,
  updated_at: string
}

interface Manifest {
  packs: ManifestPack[],
  updated_at: string
}

const packStore = localforage.createInstance({ name: 'packStore' });
const prefStore = localforage.createInstance({ name: 'prefStore' });

async function unzipPack( blob: Blob ) {
  let zip: jszip;
  try {
    zip = await jszip.loadAsync( blob );
  } catch ( loadAsyncErr ) {
    console.error( "failed to load zip: ", loadAsyncErr );
    return {};
  }
  const unzipped: Pack = {};
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

export default function Packs( { onClose }: PacksProps ) {
  const [manifest, setManifest] = useState<Manifest>( null );
  const [downloadedPacks, setDownloadedPacks] = useState<{[packId:string]: Pack | null}>( { } );
  const [currentPackId, setCurrentPackId] = useState<string>( );
  // const currentPackId = Object.keys( packs ).at( 0 );
  // const currentPack = currentPackId
  //   ? packs[currentPackId]
  //   : null;

  async function addPack( packId: string, blob: Blob ) {
    const unzippedPack: Pack = await unzipPack( blob );
    setDownloadedPacks( {
      ...downloadedPacks,
      [packId]: unzippedPack
    } );
    return packStore.setItem( packId, blob );
  }

  async function deletePack( packId: string ) {
    setDownloadedPacks( {
      ...downloadedPacks,
      [packId]: null
    } );
    return packStore.setItem( packId, null );
  }

  useEffect( ( ) => {
    async function getStoredPacks( ) {
      const packIds = await packStore.keys();
      const newPacks: {[packId: string]: Pack} = {};
      await Promise.all( packIds.map( async packId => {
        const blob: Blob | null = await packStore.getItem( packId );
        if ( !blob ) {
          console.log( "[DEBUG] no blob for: ", packId );
          return;
        }
        const unzipped = await unzipPack( blob );
        newPacks[packId] = unzipped;
      } ) );
      setDownloadedPacks( newPacks );
    }
    getStoredPacks( ).catch( e => console.error("Error loading stored packs: ", e));
  }, [] );

  useEffect( ( ) => {
    prefStore.getItem("currentPackId")
      .then(setCurrentPackId)
      .catch(e => console.error("Failed to get currentPackId: ", e))
  }, []);

  useEffect( ( ) => {
    fetch( "https://static.underfoot.rocks/manifest.json" )
      .then( r => r.json( ) )
      .then( setManifest )
      .catch( err => {
        console.error( "[ERROR] oh no!: ", err );
      })
  }, [] );

  const choosePack = (packId: string) => {
    setCurrentPackId(packId);
    prefStore.setItem("currentPackId", packId)
      .catch( e => console.error( "Failed to get currentPackId: ", e))
  }

  return (
    <>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle>
          Packs
        </DialogTitle>
      </Toolbar>
      <DialogContent>
        <DialogContentText>
          Download map data for use offline.
        </DialogContentText>
        <List>
          { manifest?.packs?.filter( pack => pack.pmtiles_path ).map( pack => (
            <ListItem
              key={pack.id}
              sx={{ pl: 0 }}
              secondaryAction={
                downloadedPacks[pack.id]
                  ? (
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={( ) => {
                        deletePack( pack.id ).catch( e => console.error('Problem deleting pack: ', e));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )
                  : (
                    <IconButton
                      edge="end"
                      color="primary"
                      aria-label="download"
                      onClick={( ) => {
                        fetch( `https://static.underfoot.rocks/${pack.pmtiles_path}` )
                          .then( r => r.blob( ) )
                          .then( blob => addPack( pack.id, blob ) )
                          .catch( err => {
                            console.log( "[DEBUG] Failed to download pack: ", err );
                          })
                      }}
                    >
                      <FileDownloadIcon />
                    </IconButton>
                  )
              }
            >
              <ListItemButton
                disabled={!downloadedPacks[pack.id]}
                sx={{ px: 0 }}
                onClick={( ) => choosePack(pack.id)}
              >
                <ListItemIcon>
                  <Radio
                    edge="start"
                    checked={currentPackId === pack.id}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={pack.name}
                  primaryTypographyProps={{
                    noWrap: true,
                  }}
                  secondary={
                    [
                      pack.description,
                      downloadedPacks[pack.id]
                        ? ` (ways: ${prettyBytes( downloadedPacks[pack.id]?.['ways']?.size || 0 )}, rocks: ${prettyBytes( downloadedPacks[pack.id]?.rocks?.size || 0 )}, water: ${prettyBytes( downloadedPacks[pack.id]?.water?.size || 0 )}, context: ${prettyBytes( downloadedPacks[pack.id]?.context?.size || 0 )}, , contours: ${prettyBytes( downloadedPacks[pack.id]?.contours?.size || 0 )})`
                        : ""
                    ].join( " " )
                  }
                  secondaryTypographyProps={{
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ) ) }
        </List>
      </DialogContent>
    </>
  );
}
