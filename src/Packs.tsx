import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import { useEffect, useState } from 'react';

import { usePackStore, Pack } from './PackStore';
import PackListItem from './PackListItem';

interface PacksProps {
  onChoose: (packId: string) => void,
  onClose: () => void
}

export default function Packs( { onChoose, onClose }: PacksProps ) {
  const packStore = usePackStore( );
  const { list: listPacks, manifest } = packStore;
  const [getPacksNeeded, setGetPacksNeeded] = useState(true);

  const [packs, setPacks] = useState<Pack[]>([])

  useEffect(() => {
    async function getPacks() {
      const listedPacks = await listPacks( );
      setPacks(listedPacks);
    }
    if (manifest && getPacksNeeded) {
      getPacks().catch(e => console.error("Failed to get packs", e));
      setGetPacksNeeded(false);
    }
  }, [
    getPacksNeeded,
    listPacks,
    manifest
  ]);

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
          { packs.map(pack => (
            <PackListItem
              key={pack.id}
              pack={pack}
              packStore={packStore}
              onChoose={onChoose}
              onDelete={() => setGetPacksNeeded(true)}
              onDownload={() => setGetPacksNeeded(true)}
            />
          )) }
        </List>
      </DialogContent>
    </>
  );
}
