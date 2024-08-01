import {useEffect, useRef, useState} from 'react';
import maplibregl, { Map, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from "pmtiles";
import Modal from '@mui/material/Modal';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Papa from 'papaparse';

import MapBottomSheet from './MapBottomSheet';
import { RockUnit, usePackStore } from './PackStore';
import { NO_STYLE, ROCK_STYLE } from './mapStyles';

// add the PMTiles plugin to the maplibregl global.
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', (request) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = (err: Error | undefined, data: any) => {
      if (err) {
        reject(err);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        resolve({data});
      }
    };
    protocol.tile(request, callback);
  });
});

interface Props {
  currentPackId: string | null;
  showPacksModal: ( ) => void;
}

interface RockUnits {
  [id: number]: RockUnit
}

interface Citation {
  source: string;
  citation: string;
}

interface Citations {
  [source: string]: string
}

export default function UnderfootMap({currentPackId, showPacksModal}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map>();
  const packStore = usePackStore( );
  const [loadedPackId, setLoadedPackId] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [packLoading, setPackLoading] = useState(false);
  const [mapFeature, setMapFeature] = useState<MapGeoJSONFeature>();
  const [rockFeature, setRockFeature] = useState<RockUnit>();
  const [rockUnits, setRockUnits] = useState<RockUnits>({});
  const [citations, setCitations] = useState<Citations>({});

  useEffect( ( ) => {
    if ( map.current ) return;
    if ( !mapContainer.current ) return;

    map.current = new maplibregl.Map( {
      container: mapContainer.current,
      center: [-122, 38],
      zoom: 2
    } );
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    map.current.on('move', () => {
      if (!map.current) return;
      const {lat, lng} = map.current.getCenter();
      const features = map.current.queryRenderedFeatures(map.current.project([lng, lat]));
      // new maplibregl.Marker()
      //   .setLngLat([lng,lat])
      //   .addTo(map.current);
      if (features.length > 0) {
        const feature = features.find(f => f.sourceLayer === 'rock_units');
        setMapFeature(feature);
      } else {
        setMapFeature(undefined);
      }
    })
  }, [map, mapContainer] );

  useEffect(() => {
    if (rockUnits && mapFeature?.properties.id) {
      const rockUnit = rockUnits[parseInt(String(mapFeature.properties.id), 10)];
      if (citations && rockUnit?.source && !rockUnit.citation) {
        rockUnit.citation = citations[rockUnit.source];
      }
      setRockFeature(rockUnit);
    } else {
      setRockFeature(undefined);
    }
  }, [citations, mapFeature, rockUnits]);

  useEffect( ( ) => {
    async function changePack() {
      if (currentPackId === loadedPackId) return;
      if (!map.current) return;
      if (packLoading) return;
      setPackLoading(true);
      // If there's no pack, ensure style gets reset so map is blank
      if (!currentPackId) {
        setLoadedPackId(null);
        map.current.setStyle(NO_STYLE);
        setPackLoading(false);
        return;
      }
      const currentPack = await packStore.get(currentPackId);
      if (!currentPack) throw new Error(`Pack not downloaded: ${currentPackId}`);
      const packData = await currentPack.unzippedData();
      if (!packData.ways_pmtiles) throw new Error(`Pack ${currentPackId} did not have ways data`);
      const waysPmtiles = new pmtiles.PMTiles(
        new pmtiles.FileSource(
          // The filename is important b/c it's a key that we use to refer to
          // this "protocol" in the sources
          new File( [packData.ways_pmtiles], "ways" )
        )
      );
      protocol.add(waysPmtiles);
      if (!packData.rocks_pmtiles) throw new Error(`Pack ${currentPackId} did not have rocks data`);
      const rocksPmtiles = new pmtiles.PMTiles(
        new pmtiles.FileSource(new File([packData.rocks_pmtiles], "rocks"))
      );
      protocol.add(rocksPmtiles);
      map.current.setStyle(ROCK_STYLE);
      if (packData.rocks_units_csv) {
        Papa.parse(new File([packData.rocks_units_csv], 'rocks_units_csv'), {
          header: true,
          dynamicTyping: true,
          complete: results => {
            const emptyRockUnits: RockUnits = {};
            const newUnits = results.data.reduce((memo, curr) => {
              const rockUnit = curr as RockUnit;
              const rockUnitsMemo: RockUnits = memo as RockUnits;
              rockUnitsMemo[rockUnit.id] = rockUnit;
              return rockUnitsMemo;
            }, emptyRockUnits);
            setRockUnits(newUnits as RockUnits);
          }
        });
      }
      if (packData.rocks_citations_csv) {
        Papa.parse(new File([packData.rocks_citations_csv], 'citations_csv'), {
          header: true,
          dynamicTyping: true,
          complete: results => {
            const emptyCitations: Citations = {};
            const newCitations = results.data.reduce((memo, curr) => {
              const citation = curr as Citation;
              const citationsMemo: Citations = memo as Citations;
              citationsMemo[citation.source] = citation.citation;
              return citationsMemo;
            }, emptyCitations) as Citations;
            setCitations((existing: Citations) => ({...existing, ...newCitations}));
          }
        });
      }
      const waysHeader = await waysPmtiles.getHeader( );
      map.current.setZoom(waysHeader.maxZoom - 2);
      map.current.setCenter([waysHeader.centerLon, waysHeader.centerLat])
      setLoadedPackId(currentPackId);
      setPackLoading(false);
    }
    if (
      packStore
      && currentPackId !== loadedPackId
      && map.current
    ) {
      changePack().catch(e => console.error(`Failed to change to pack ${currentPackId}`, e));
    }
  }, [
    packLoading,
    packStore,
    currentPackId,
    mapLoaded,
    loadedPackId
  ])

  return (
    <div className='map-wrapper'>
      <div className={`map ${loadedPackId ? 'loaded': ''}`} ref={mapContainer} />
      { loadedPackId && (
        <>
          <AddIcon fontSize='large' className="add-icon" />
          <MapBottomSheet feature={rockFeature} />
        </>
      ) }
      { !loadedPackId && !packLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p>Welcome to Underfoot! To get started,</p>
          <Button onClick={showPacksModal} variant="contained">DOWNLOAD SOME DATA</Button>
        </div>
      )}
      <Modal
        open={packLoading}
        className="loading-modal"
      >
        <div className="inner">
          <CircularProgress />
        </div>
      </Modal>
    </div>
  )
}
