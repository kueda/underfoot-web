import {useEffect, useRef, useState} from 'react';
import maplibregl, { Map, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from "pmtiles";
import Modal from '@mui/material/Modal';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

import MapBottomSheet from './MapBottomSheet/MapBottomSheet';
import CurrentLocationButton from './CurrentLocationButton';
import { usePackStore } from '../packs/usePackStore';
import { UnderfootFeature } from '../packs/types';
import { Citations, UnderfootFeatures } from './types';
import { NO_STYLE } from './mapStyles';
import { useCurrentPackId, useMapType, useShowPacksModal } from '../useAppStore';
import { loadMapFromPackData } from './util';

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

export default function UnderfootMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map>();
  const mapType = useMapType();
  const currentPackId = useCurrentPackId();
  const showPacksModal = useShowPacksModal( );
  const packStore = usePackStore( );
  const [loadedPackId, setLoadedPackId] = useState<string | null>(null);
  const [loadedMapType, setLoadedMapType] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [packLoading, setPackLoading] = useState(false);
  const [mapFeature, setMapFeature] = useState<MapGeoJSONFeature>();
  const [underfootFeature, setUnderfootFeature] = useState<UnderfootFeature>();
  const [underfootFeatures, setUnderfootFeatures] = useState<UnderfootFeatures>({});
  const [citations, setCitations] = useState<Citations>({});

  const sourceLayer = 'rock_units';

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
    });
    map.current.on('click', clickEvent => {
      map.current?.panTo(clickEvent.lngLat);
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
      changePack().catch(e => {
        const error = e as Error;
        alert(`Failed to change to pack ${currentPackId}: ${error.message}`);
        console.error(`Failed to change to pack ${currentPackId}`, error);
      });
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
      <CurrentLocationButton map={map.current} />
      { loadedPackId && (
        <>
          <AddIcon fontSize='large' className="add-icon" style={{pointerEvents: 'none'}} />
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
