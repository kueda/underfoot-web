import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MapIcon from '@mui/icons-material/Map';
import Dialog from '@mui/material/Dialog';

import Packs from './Packs'

import { useState } from 'react';

interface DrawerProps {
  drawerOpen: boolean,
  setCurrentPackId: (packId: string) => void,
  setDrawerOpen: (newVal: boolean) => void
}

export default function UnderfootDrawer({
  drawerOpen,
  setCurrentPackId,
  setDrawerOpen
}: DrawerProps) {
  const [packsModalShown, setPacksModalShown] = useState(false);
	return (
    <>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <MapIcon />
                </ListItemIcon>
                <ListItemText primary="Rocks" />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={( ) => setPacksModalShown(existing => !existing)}>
                <ListItemIcon>
                  <MapIcon />
                </ListItemIcon>
                <ListItemText primary="Packs" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Dialog
        open={packsModalShown}
        fullScreen
        onClose={( ) => setPacksModalShown(false)}
      >
        <Packs
          onChoose={setCurrentPackId}
          onClose={() => setPacksModalShown(false)}
        />
      </Dialog>
    </>
	);
}
