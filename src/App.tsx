import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';
import Dialog from '@mui/material/Dialog';

import AppBar from './AppBar';
import Map from './Map';
import Packs from './Packs'

import './App.css'
import {usePackStore} from './PackStore';

function App() {
  const [currentPackId, setCurrentPackId] = React.useState<string | null>(null);
  const [packsModalShown, setPacksModalShown] = React.useState(false);
  const packStore = usePackStore();
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
        showPacksModal={() => setPacksModalShown(true)}
      />
      <Map currentPackId={currentPackId} showPacksModal={() => setPacksModalShown(true)} />
      <Dialog
        open={packsModalShown}
        fullScreen
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
