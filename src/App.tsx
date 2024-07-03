import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';

import AppBar from './AppBar';
import Map from './Map';

import './App.css'
import {usePackStore} from './PackStore';

function App() {
  const [currentPackId, setCurrentPackId] = React.useState<string>();
  const packStore = usePackStore();
  React.useEffect(( ) => {
    async function getCurrentPackId() {
      try {
        const packId = await packStore.getCurrentPackId();
        setCurrentPackId(packId);
      } catch (err) {
        console.error('Failed to get current pack ID', err);
      }
    }
    if (packStore) getCurrentPackId().catch(e => console.error('Failed to get current pack ID', e));
  }, [packStore]);
  return (
    <>
      <CssBaseline />
      <AppBar setCurrentPackId={setCurrentPackId} />
      <Map currentPackId={currentPackId} />
    </>
  )
}

export default App
