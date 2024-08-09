import { Drawer as Vaul } from 'vaul';
import { useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { startCase } from 'lodash';
import Autolinker from 'autolinker';

import { RockUnit, UnderfootFeature } from "./PackStore";

interface Props {
  feature?: UnderfootFeature | RockUnit;
  mapType: 'rocks' | 'water'
}

const CLOSED_HEIGHT = '90px';

function humanizeAge(age?: string | number) {
  const unknown = '?';
  if (age === 0) return "0"
  if (!age) return unknown;
  let ageNum: number;
  if (typeof (age) === 'string') {
    ageNum = parseFloat(age);
    if (ageNum === 0) return unknown;
  } else {
    ageNum = age;
  }
  if (ageNum >= 1000000000) {
    return `${(ageNum / 1000000000.0).toLocaleString(undefined, {maximumFractionDigits: 1})} Ga`;
  }
  if (ageNum >= 1000000) {
    return `${(ageNum / 1000000.0).toLocaleString(undefined, {maximumFractionDigits: 1})} Ma`;
  }
  if (ageNum >= 100000) {
    return `${(ageNum / 1000.0).toLocaleString(undefined, {maximumFractionDigits: 1})} ka`;
  }
  return `${ageNum.toLocaleString()} years`;
}

function RocksHeader( { feature }: { feature?: RockUnit } ) {
  return (
    <>
      <h3>
        {feature?.title || 'Unknown'}
      </h3>
      <div className="MapBottomSheetHeaderPreview">
        <div>
          <label>Lithology</label>
          {startCase(feature?.lithology || 'Unknown')}
        </div>
        <div>
          <label>Age</label>
          {feature?.est_age ? humanizeAge(feature.est_age) : 'Unknown'}
        </div>
      </div>
    </>
  );
}

function WaterHeader( { feature }: { feature?: UnderfootFeature } ) {
  return (
    <>
      <h3>
        {feature?.title || 'Unknown'}
      </h3>
      <div className="MapBottomSheetHeaderPreview">
        <div>{ "it's water, ok?" }</div>
      </div>
    </>
  );
}

function RocksBody( { feature, descRef }: {
  feature?: RockUnit,
  descRef: React.RefObject<HTMLParagraphElement>
} ) {
  return (
    <>
      { feature?.description && (
        <>
          <h3>Description</h3>
          <p ref={descRef}>{feature?.description}</p>
        </>
      ) }
      <h3>Estimated Age</h3>
      <p>{startCase(feature?.controlled_span)} ({humanizeAge(feature?.min_age)} - {humanizeAge(feature?.max_age)})</p>
      <h4>Source</h4>
      <small
        dangerouslySetInnerHTML={{
          __html: feature?.citation
            ? Autolinker.link(feature.citation)
            : feature?.source || ""
        }}
      />
    </>
  );
}

function WaterBody( { feature, descRef }: {
  feature?: UnderfootFeature,
  descRef: React.RefObject<HTMLParagraphElement>
} ) {
  return (
    <>
      <h3>Description</h3>
      <p ref={descRef}>{feature?.title}</p>
    </>
  );
}

function MapBottomSheet({ feature, mapType }: Props) {
  const [snap, setSnap] = useState<number | string | null | undefined>(CLOSED_HEIGHT);
  const bodyRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  // If the description is more than twice the height of the body, treat it as
  // scrollable. Allowing scrolling messes up the drag to dismiss
  // interaction, so it should be avoided when we don't have to scroll to
  // show content
  const scrollable = (descRef?.current?.clientHeight || 0) >= (bodyRef?.current?.clientHeight || 0) / 2;

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
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            zIndex: 1101
          }}
        >
          <div className={`MapBottomSheet ${snap === 1 ? 'open': ''} ${scrollable ? 'scrollable' : ''}`}>
            <div
              className="MapBottomSheetHeader"
              style={{ height: CLOSED_HEIGHT }}
            >
              <div className="MapBottomSheetHeaderContent">
                { mapType === 'rocks'
                  ? <RocksHeader feature={feature as RockUnit} />
                  : <WaterHeader feature={feature} />
                }
              </div>
              <div className="MapBottomSheetHeaderActions">
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
            <div className="MapBottomSheetBody" ref={bodyRef}>
              { mapType === 'rocks'
                ? <RocksBody feature={feature as RockUnit} descRef={descRef} />
                : <WaterBody feature={feature} descRef={descRef} />
              }
            </div>
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}

export default MapBottomSheet;
