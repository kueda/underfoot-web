import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import { useEffect, useState } from 'react';

import { usePackStore } from '../packs/usePackStore';
import { Pack } from '../packs/Pack';
import PackTab from './PackTab';
import { useCurrentPackId, useHidePacksModal, useSetCurrentPackId } from '../useAppStore';

export default function Packs() {
  const packStore = usePackStore( );
  const currentPackId = useCurrentPackId();
  const onChoose = useSetCurrentPackId();
  const onClose = useHidePacksModal();
  const { list: listPacks, manifest, listLocal, error } = packStore;
  const [loading, setLoading] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const [packs, setPacks] = useState<Pack[] | null>(null);
  const [downloadedPacks, setDownloadedPacks] = useState<Pack[] | null>(null);
  const [currentTab, setCurrentTab] = useState<'all' | 'downloaded'>('all');

  const packsLoaded = packs !== null;
  const downloadedPacksLoaded = downloadedPacks !== null;

  useEffect(() => {
    async function getPacks() {
      const listedPacks = await listPacks( );
      setPacks(listedPacks);
    }
    if (manifest && !packsLoaded) {
      setLoading(true);
      getPacks()
        .catch(e => console.error("Failed to get packs", e))
        .finally(() => setLoading(false));
    }
  }, [
    listPacks,
    manifest,
    packsLoaded
  ]);

  useEffect(() => {
    if (!downloadedPacksLoaded) {
      setLoadingLocal(true);
      listLocal()
        .then(localPacks => setDownloadedPacks(localPacks))
        .catch(e => console.error('Failed to get local packs', e))
        .finally(( ) => setLoadingLocal(false));
    }
  }, [listLocal, downloadedPacksLoaded]);

  const isOffline = !!error?.message?.match(/NetworkError/);

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
        
        <TabContext value={currentTab}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList
              onChange={(_event: React.SyntheticEvent, newVal: "all" | "downloaded") => setCurrentTab(newVal)}
              aria-label="Packs"
            >
              <Tab label="All" value="all" />
              <Tab label="Downloaded" value="downloaded" />
            </TabList>
          </Box>
          <PackTab
            value='all'
            packs={packs}
            isOffline={isOffline}
            loading={loading}
            currentPackId={currentPackId}
            packStore={packStore}
            description={
              isOffline && !loading
                ? "Looks like you're offline. You can choose packs you've already downloaded or "
                  + "try again when you're online."
                : null
            }
            onChoose={onChoose}
            onDelete={() => {
              setPacks(null);
              setDownloadedPacks(null);
            }}
            onDownload={() => {
              setPacks(null);
              setDownloadedPacks(null);
            }}
          />
          <PackTab
            value='downloaded'
            packs={downloadedPacks}
            isOffline={isOffline}
            loading={loadingLocal}
            currentPackId={currentPackId}
            packStore={packStore}
            description={
              !loadingLocal && (downloadedPacks === null || downloadedPacks?.length === 0)
                ? "No packs downloaded yet."
                : null
            }
            onChoose={onChoose}
            onDelete={() => {
              setPacks(null);
              setDownloadedPacks(null);
            }}
            onDownload={() => {
              setPacks(null);
              setDownloadedPacks(null);
            }}
          />
        </TabContext>
      </DialogContent>
    </>
  );
}
