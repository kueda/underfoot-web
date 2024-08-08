import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import AppBar from './AppBar';
import Map from './Map';
import Packs from './Packs'

import './App.css'
import {usePackStore} from './PackStore';

function App() {
  const [currentPackId, setCurrentPackId] = React.useState<string | null>(null);
  const [mapType, setMapType] = React.useState<'rocks' | 'water'>('rocks');
  const [packsModalShown, setPacksModalShown] = React.useState(false);
  const packStore = usePackStore();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(( ) => {
    async function getCurrentPackId() {
      try {
        const packId = await packStore.getCurrentPackId();
        if (packId) setCurrentPackId(packId);
      } catch (err) {
        console.error('Failed to get current pack ID', err);
      }
    }
    if (packStore) getCurrentPackId().catch(e => console.error('Failed to get current pack ID', e));
  }, [packStore]);

  return (
    <>
      <CssBaseline />
      <AppBar
        currentPackId={currentPackId}
        mapType={mapType}
        setMapType={setMapType}
        showPacksModal={() => setPacksModalShown(true)}
      />
      <Map
        mapType={mapType}
        currentPackId={currentPackId}
        showPacksModal={() => setPacksModalShown(true)}
      />
      <Dialog
        open={packsModalShown}
        fullScreen={isSmall}
        fullWidth
        maxWidth="lg"
        onClose={( ) => setPacksModalShown(false)}
      >
        <Packs
          currentPackId={currentPackId}
          onChoose={setCurrentPackId}
          onClose={() => setPacksModalShown(false)}
        />
      </Dialog>
    </>
  )
}

export default App
