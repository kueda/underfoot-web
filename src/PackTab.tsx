import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import List from '@mui/material/List';
import TabPanel from '@mui/lab/TabPanel';

import { Pack, PackStore } from './PackStore';
import PackListItem from './PackListItem';

interface PackTabProps {
  currentPackId: string | null;
  description: string | null;
  isOffline: boolean;
  loading: boolean;
  onChoose: (packId: string | null) => void;
  onDelete: () => void;
  onDownload: () => void;
  packs: Pack[] | null;
  packStore: PackStore;
  value: string;
}

const PackTab = ({
  currentPackId,
  description,
  loading,
  onChoose,
  onDelete,
  onDownload,
  packs,
  packStore,
  value,
}: PackTabProps) => (
  <TabPanel value={value} sx={{padding: 0}}>
    {loading && <CircularProgress />}
    {description && (
      <DialogContentText sx={{textAlign: 'center', p: 4}}>
        {description}
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
          onDelete={onDelete}
          onDownload={onDownload}
        />
      )) }
    </List>
  </TabPanel>
);

export default PackTab;
