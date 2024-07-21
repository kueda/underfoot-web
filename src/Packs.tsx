import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useEffect, useState } from 'react';

import { usePackStore, Pack } from './PackStore';
import PackListItem from './PackListItem';

interface PacksProps {
  currentPackId: string | null,
  onChoose: (packId: string | null) => void,
  onClose: () => void
}

export default function Packs( {
  currentPackId,
  onChoose,
  onClose
}: PacksProps ) {
  const packStore = usePackStore( );
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

  const isOffline = error?.message?.match(/NetworkError/);

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
          <TabPanel value="all">
            {loading && !isOffline && <CircularProgress />}
            {isOffline && (
              <DialogContentText sx={{textAlign: 'center'}}>
                {"Looks like you're offline. You can choose packs from the Downloaded section or try again when " + 
                 "you're online."}
              </DialogContentText>
            )}
            <List>
              { packs?.map(pack => (
                <PackListItem
                  key={pack.id}
                  currentPackId={currentPackId}
                  pack={pack}
                  packStore={packStore}
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
              )) }
            </List>
          </TabPanel>
          <TabPanel value="downloaded">
            {loadingLocal && <CircularProgress />}
            {!loadingLocal && (downloadedPacks === null || downloadedPacks?.length === 0) && (
              <DialogContentText sx={{textAlign: 'center'}}>
                No packs downloaded yet.
              </DialogContentText>
            )}
            <List>
              { downloadedPacks?.map(pack => (
                <PackListItem
                  key={`downloaded-${pack.id}`}
                  currentPackId={currentPackId}
                  pack={pack}
                  packStore={packStore}
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
              )) }
            </List>
          </TabPanel>
        </TabContext>
      </DialogContent>
    </>
  );
}
