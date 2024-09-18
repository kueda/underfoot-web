import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BackpackIcon from '@mui/icons-material/Backpack';
import LandscapeIcon from '@mui/icons-material/Landscape';
import WaterIcon from '@mui/icons-material/Water';

import {
  ROCKS,
  WATER,
  useShowPacksModal,
  useMapType,
  useSetMapType
} from './useAppStore';

interface DrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: (newVal: boolean) => void;
}

export default function UnderfootDrawer({
  drawerOpen,
  setDrawerOpen,
}: DrawerProps) {
  const showPacksModal = useShowPacksModal();
  const mapType = useMapType();
  const setMapType = useSetMapType();
	return (
    <>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            <ListItem disablePadding>
              <ListItemButton selected={mapType === ROCKS} onClick={() => setMapType(ROCKS)}>
                <ListItemIcon>
                  <LandscapeIcon />
                </ListItemIcon>
                <ListItemText primary="Rocks" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={mapType === WATER} onClick={() => setMapType(WATER)}>
                <ListItemIcon>
                  <WaterIcon />
                </ListItemIcon>
                <ListItemText primary="Water" />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={showPacksModal}>
                <ListItemIcon>
                  <BackpackIcon />
                </ListItemIcon>
                <ListItemText primary="Packs" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
	);
}
