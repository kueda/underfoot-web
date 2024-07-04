import { Drawer as Vaul } from 'vaul';
import { useState } from 'react';
import { MapGeoJSONFeature } from 'maplibre-gl';
import IconButton from '@mui/material/IconButton';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

interface Props {
  feature?: MapGeoJSONFeature;
}

const CLOSED_HEIGHT = '140px';

function MapBottomSheet({ feature }: Props) {
  const [snap, setSnap] = useState<number | string | null | undefined>(CLOSED_HEIGHT);
  return (
    <Vaul.Root
      open
      snapPoints={[CLOSED_HEIGHT, 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      dismissible={false}
      modal={false}
    >
      <Vaul.Portal>
        <Vaul.Content
          style={{
            position: "fixed",
            width: "100%",
            height: "100%",
            bottom: 0,
            left: 0,
            right: 0,
            // the rest is gravy
            backgroundColor: "white",
            zIndex: 1101
          }}
        >
          <div>
            <div
              style={{
                width: "100%",
                background: "none",
                textAlign: "start",
                padding: 20,
                // border: "1px solid red",
                height: CLOSED_HEIGHT,
                display: 'flex',
                flexDirection: 'row'
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <Vaul.Title style={{ margin: 0 }}>{feature?.properties.lithology || 'Unknown'}</Vaul.Title>
                <p>{feature?.properties.controlled_span || 'Unknown'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingRight: 20 }}>
                <IconButton
                  aria-label="show full feature properties"
                  onClick={( ) => setSnap( snap === 1 ? CLOSED_HEIGHT : 1 )}
                >
                  { snap === 1
                    ? <CloseFullscreenIcon />
                    : <OpenInFullIcon />
                  }
                </IconButton>
              </div>
            </div>
            <p style={{padding: 20}}><code>{ JSON.stringify(feature?.properties, null, 2) }</code></p>
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}

export default MapBottomSheet;
