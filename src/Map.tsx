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
import { UnderfootFeature, usePackStore, UnzippedPackData } from './PackStore';
import { NO_STYLE, ROCK_STYLE, WATER_STYLE } from './mapStyles';

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
  mapType: 'rocks' | 'water';
  showPacksModal: ( ) => void;
}

interface UnderfootFeatures {
  [id: number]: UnderfootFeature
}

interface Citation {
  source: string;
  citation: string;
}

interface Citations {
  [source: string]: string
}

function loadMapFromPackData(
  packData: UnzippedPackData,
  protocol: pmtiles.Protocol,
  map: maplibregl.Map,
  mapType: string,
  setFeatures: React.Dispatch<React.SetStateAction<UnderfootFeatures>>,
  setCitations: React.Dispatch<React.SetStateAction<Citations>>,
) {
  let pmtilesBlob: Blob | undefined;
  let featuresBlob: Blob | undefined;
  let citationsBlob: Blob | undefined;
  let style: maplibregl.StyleSpecification;
  if (mapType === 'rocks') {
    pmtilesBlob = packData.rocks_pmtiles;
    featuresBlob = packData.rocks_units_csv;
    citationsBlob = packData.rocks_citations_csv;
    style = ROCK_STYLE;
  } else {
    pmtilesBlob = packData.water_pmtiles;
    citationsBlob = packData.water_citations_csv;
    style = WATER_STYLE;
  }
  if (!pmtilesBlob) throw new Error(`Pack did not have ${mapType} data`);
  if (!citationsBlob) throw new Error(`Pack did not have ${mapType} citations`);

  const pmtilesData = new pmtiles.PMTiles(
    new pmtiles.FileSource(new File([pmtilesBlob], mapType))
  );
  protocol.add(pmtilesData);
  map.setStyle(style);
  if (featuresBlob) {
    Papa.parse(new File([featuresBlob], `${mapType}_metadata`), {
      header: true,
      dynamicTyping: true,
      complete: results => {
        const emptyFeatures: UnderfootFeatures = {};
        const newFeatures = results.data.reduce((memo, curr) => {
          const feature = curr as UnderfootFeature;
          const featuresMemo: UnderfootFeatures = memo as UnderfootFeatures;
          featuresMemo[feature.id] = feature;
          return featuresMemo;
        }, emptyFeatures);
        console.log('[Map.tsx] newFeatures', newFeatures)
        setFeatures(newFeatures as UnderfootFeatures);
      }
    });
  }
  if (citationsBlob) {
    Papa.parse(new File([citationsBlob], `${mapType}_citations`), {
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
}

export default function UnderfootMap({
  currentPackId,
  showPacksModal,
  mapType = 'rocks'
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map>();
  const packStore = usePackStore( );
  const [loadedPackId, setLoadedPackId] = useState<string | null>(null);
  const [loadedMapType, setLoadedMapType] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [packLoading, setPackLoading] = useState(false);
  const [mapFeature, setMapFeature] = useState<MapGeoJSONFeature>();
  const [underfootFeature, setUnderfootFeature] = useState<UnderfootFeature>();
  const [underfootFeatures, setUnderfootFeatures] = useState<UnderfootFeatures>({});
  const [citations, setCitations] = useState<Citations>({});

  // props
  const sourceLayer = 'rock_units';
  // /props

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
        const feature = features.find(f => f.sourceLayer === sourceLayer);
        setMapFeature(feature);
      } else {
        setMapFeature(undefined);
      }
    })
  }, [map, mapContainer] );

  useEffect(() => {
    if (underfootFeatures && mapFeature?.properties.id) {
      const feature = underfootFeatures[parseInt(String(mapFeature.properties.id), 10)];
      if (citations && feature?.source && !feature.citation) {
        feature.citation = citations[feature.source];
      }
      setUnderfootFeature(feature);
    } else {
      setUnderfootFeature(undefined);
    }
  }, [citations, mapFeature, underfootFeatures]);

  useEffect( ( ) => {
    async function changePack() {
      if (currentPackId === loadedPackId && mapType === loadedMapType) return;
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

      loadMapFromPackData(
        packData,
        protocol,
        map.current,
        mapType,
        setUnderfootFeatures,
        setCitations
      );

      const waysHeader = await waysPmtiles.getHeader( );
      map.current.setZoom(waysHeader.maxZoom - 2);
      map.current.setCenter([waysHeader.centerLon, waysHeader.centerLat])
      setLoadedPackId(currentPackId);
      setLoadedMapType(mapType);
      setPackLoading(false);
    }
    if (
      packStore
      && ( currentPackId !== loadedPackId || mapType !== loadedMapType )
      && map.current
    ) {
      changePack().catch(e => console.error(`Failed to change to pack ${currentPackId}`, e));
    }
  }, [
    currentPackId,
    loadedMapType,
    loadedPackId,
    mapLoaded,
    mapType,
    packLoading,
    packStore
  ])

  return (
    <div className='map-wrapper'>
      <div className={`map ${loadedPackId ? 'loaded': ''}`} ref={mapContainer} />
      { loadedPackId && (
        <>
          <AddIcon fontSize='large' className="add-icon" />
          <MapBottomSheet feature={underfootFeature} mapType={mapType} />
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
