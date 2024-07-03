import { Drawer as Vaul } from 'vaul';
import { useState } from 'react';

function MapBottomSheet() {
  const [snap, setSnap] = useState<number | string | null | undefined>("100px");
  return (
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
            zIndex: 1101
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
  );
}

export default MapBottomSheet;
