import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';

import AppBar from './AppBar';
import Map from './Map/Map';
import PacksDialog from './PacksDialog/PacksDialog';

import './App.css'
import {usePackStore} from './packs/usePackStore';
import { useSetCurrentPackId } from './useAppStore';

function App() {
  const setCurrentPackId = useSetCurrentPackId();
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
  }, [packStore, setCurrentPackId]);

  return (
    <>
      <CssBaseline />
      <AppBar />
      <Map />
      <PacksDialog />
    </>
  )
}

export default App
