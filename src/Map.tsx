import { Drawer as Vaul } from 'vaul';
import React from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function UnderfootMap() {
  const [snap, setSnap] = React.useState<number | string | null | undefined>("100px");
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<Map>();

  React.useEffect( ( ) => {
    if ( map.current ) return;
    if ( !mapContainer.current ) return;

    map.current = new maplibregl.Map( {
      container: mapContainer.current,
      center: [-122, 38],
      zoom: 2,
      style: 'https://demotiles.maplibre.org/style.json'
    } );
  }, [map, mapContainer] );

  return (
    <div className="map-wrapper">
      <div className="map" ref={mapContainer} />
      <Vaul.Root
        open
        snapPoints={["100px", 1]}
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
              backgroundColor: "red",
              zIndex: 1200
            }}
          >
            <div>
              <div
                style={{
                  width: "100%",
                  background: "none",
                  textAlign: "start",
                  paddingLeft: 20,
                  border: "1px solid green",
                  height: 100,
                  display: 'flex',
                  flexDirection: 'row'
                }}
              >
                <div style={{ flexGrow: 1 }}>
                  <Vaul.Title style={{ margin: 0 }}>Bottom sheet title</Vaul.Title>
                  <p>Bottom sheet meta</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingRight: 20 }}>
                  <button
                    type="button"
                    onClick={( ) => setSnap( snap === 1 ? "100px" : 1 )}
                  >
                    { snap === 1 ? 'Less' : 'More' }
                  </button>
                </div>
              </div>
              <p>Lorem ipsum labore tempor sit enim minim sed nostrud id sed et eiusmod laborum aliqua dolore velit duis veniam occaecat aliqua dolore ex ea consectetur veniam laborum consequat quis tempor qui.</p>
            </div>
          </Vaul.Content>
        </Vaul.Portal>
      </Vaul.Root>
    </div>
  )
}
