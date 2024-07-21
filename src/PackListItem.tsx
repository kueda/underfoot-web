import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Radio from '@mui/material/Radio';
import StopIcon from '@mui/icons-material/Stop';
import { useState } from 'react';

import { Pack, PackStore } from './PackStore';

interface Props {
  currentPackId: string | null,
  onChoose?: (packId: string | null) => void,
  onDelete?: ( ) => void,
  onDownload?: ( ) => void,
  pack: Pack,
  packStore: PackStore
}

const PackListItem = ( {
  currentPackId,
  onChoose,
  onDelete,
  onDownload,
  pack,
  packStore
}: Props ) => {
  const isDownloaded = !!pack.zippedData;
  const [downloadProgress, setDownloadProgress] = useState<null | {loadedBytes: number, totalBytes: number}>(null);
  const [abortController, setAbortController] = useState(new AbortController());
  let secondaryAction;
  if (isDownloaded) {
    secondaryAction = (
      <IconButton
        edge="end"
        aria-label="delete"
        onClick={( ) => {
          packStore.remove( pack.id )
            .then(( ) => ( typeof ( onDelete ) === "function" ? onDelete() : null))
            .then(() => ( typeof ( onChoose ) === "function" ? onChoose(null) : null))
            .catch( e => console.error('Problem deleting pack: ', e));
        }}
      >
        <DeleteIcon />
      </IconButton>
    );
  } else if (downloadProgress) {
    const progress = Math.round(downloadProgress.loadedBytes / downloadProgress.totalBytes * 100);
    secondaryAction = (
      <Box sx={{ position: 'relative', display: 'inline-flex', mr: -1.5 }}>
        <CircularProgress variant="determinate" value={progress} />
        <IconButton
          edge="end"
          aria-label="stop"
          onClick={( ) => abortController.abort()}
          sx={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StopIcon color="primary" />
        </IconButton>
      </Box>
    );
  } else {
    secondaryAction = (
      <IconButton
        edge="end"
        color="primary"
        aria-label="download"
        onClick={( ) => {
          const ac = new AbortController();
          setAbortController(ac);
          packStore.download(pack.id, {onProgress: setDownloadProgress, signal: ac.signal})
            .then(() => ( typeof ( onDownload ) === "function" ? onDownload() : null))
            .then(() => ( typeof ( onChoose ) === "function" ? onChoose(pack.id) : null))
            .catch((e: Error) => {
              if (e?.message?.match(/aborted/)) {
                setDownloadProgress(null);
                return;
              }
              console.error('Failed to download pack', e);
            });
        }}
      >
        <FileDownloadIcon />
      </IconButton>
    );
  }
  return (
    <ListItem
      key={pack.id}
      sx={{ pl: 0 }}
      secondaryAction={secondaryAction}
    >
      <ListItemButton
        disabled={!isDownloaded}
        sx={{ px: 0 }}
        onClick={( ) => {
          packStore.setCurrent(pack.id);
          if (typeof(onChoose) === "function") onChoose(pack.id);
        }}
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
              // pack instanceof StoredPack
              //   ? ` (ways: ${prettyBytes( downloadedPacks[pack.id]?.['ways']?.size || 0 )}, rocks: ${prettyBytes( downloadedPacks[pack.id]?.rocks?.size || 0 )}, water: ${prettyBytes( downloadedPacks[pack.id]?.water?.size || 0 )}, context: ${prettyBytes( downloadedPacks[pack.id]?.context?.size || 0 )}, , contours: ${prettyBytes( downloadedPacks[pack.id]?.contours?.size || 0 )})`
              //   : ""
            ].join( " " )
          }
          secondaryTypographyProps={{
            noWrap: true,
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default PackListItem;
