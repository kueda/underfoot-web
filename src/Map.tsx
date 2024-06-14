import { Drawer as Vaul } from 'vaul';
import React from 'react';

export default function UnderfootMap() {
  const [snap, setSnap] = React.useState<number | string | null>("100px");
  return (
    <div
      style={{
        backgroundColor: "lightyellow",
        width: "100%",
        height: "100%",
        position: "fixed",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <p>Map goes here</p>
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
              <button
                type="button"
                onClick={( ) => setSnap( snap === 1 ? "100px" : 1 )}
                style={{
                  width: "100%",
                  background: "none",
                  textAlign: "start",
                  paddingLeft: 20,
                  border: "1px solid green",
                  height: 100
                }}
              >
                <Vaul.Title style={{ margin: 0 }}>Bottom sheet title</Vaul.Title>
                <p>Bottom sheet meta</p>
              </button>
              <p>Lorem ipsum labore tempor sit enim minim sed nostrud id sed et eiusmod laborum aliqua dolore velit duis veniam occaecat aliqua dolore ex ea consectetur veniam laborum consequat quis tempor qui.</p>
            </div>
          </Vaul.Content>
        </Vaul.Portal>
      </Vaul.Root>
    </div>
  )
}
