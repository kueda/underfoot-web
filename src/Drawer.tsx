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


interface DrawerProps {
  drawerOpen: boolean;
  mapType: 'rocks' | 'water';
  setDrawerOpen: (newVal: boolean) => void;
  setMapType: (newMapType: 'rocks' | 'water') => void;
  showPacksModal: ( ) => void;
}

export default function UnderfootDrawer({
  drawerOpen,
  mapType,
  setDrawerOpen,
  setMapType,
  showPacksModal
}: DrawerProps) {
	return (
    <>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            <ListItem disablePadding>
              <ListItemButton selected={mapType === 'rocks'} onClick={() => setMapType('rocks')}>
                <ListItemIcon>
                  <LandscapeIcon />
                </ListItemIcon>
                <ListItemText primary="Rocks" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={mapType === 'water'} onClick={() => setMapType('water')}>
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
