import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map, MapGeoJSONFeature, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from 'pmtiles';
import Modal from '@mui/material/Modal';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

import { usePackStore } from '../packs/usePackStore';
import { UnderfootFeature, WaterFeature } from '../packs/types';
import { addLog, useCurrentPackId, useMapType, useShowPacksModal, useLogging } from '../useAppStore';
import MapBottomSheet from './MapBottomSheet/MapBottomSheet';
import CurrentLocationButton from './CurrentLocationButton';
import { Citations, UnderfootFeatures } from './types';
import { NO_STYLE } from './mapStyles';
import { loadMapFromPackData } from './util';

// add the PMTiles plugin to the maplibregl global.
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', request => {
  // Log tile requests for debugging
  const tileMatch = request.url.match(/pmtiles:\/\/(\w+)\/(\d+)\/(\d+)\/(\d+)/);
  if (tileMatch) {
    const [, source, z, x, y] = tileMatch;
    addLog(`[PMTiles] Requesting tile ${source} ${z}/${x}/${y}`);
  }

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = (err: Error | undefined, data: any) => {
      if (err) {
        addLog(`[PMTiles] Tile fetch failed: ${err.message}`);
        reject(err);
      }
      else {
        if (tileMatch) {
          const [, source] = tileMatch;
          addLog(`[PMTiles] Tile fetch succeeded for ${source}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        resolve({ data });
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
  const showPacksModal = useShowPacksModal();
  const packStore = usePackStore();
  const [loadedPackId, setLoadedPackId] = useState<string | null>(null);
  const [loadedMapType, setLoadedMapType] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [packLoading, setPackLoading] = useState(false);
  const [mapFeature, setMapFeature] = useState<MapGeoJSONFeature>();
  const [underfootFeature, setUnderfootFeature] = useState<UnderfootFeature>();
  const [underfootFeatures, setUnderfootFeatures] = useState<UnderfootFeatures>({});
  const [citations, setCitations] = useState<Citations>({});
  const { add: log } = useLogging();

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        center: [-122, 38],
        zoom: 2,
        maxZoom: 22,
        attributionControl: false,
      });
      map.current.on('load', () => {
        setMapLoaded(true);
        log('Map initial load complete');
      });
      map.current.on('idle', () => {
        log('Map idle - all tiles loaded and rendered');
      });
      map.current.on('sourcedata', e => {
        if (e.isSourceLoaded) {
          log(`Source ${e.sourceId} finished loading`);
        }
      });
      map.current.on('error', e => {
        const errorMessage = (e.error as Error | undefined)?.message || 'Unknown error';
        log(`Map error: ${errorMessage}`);
        console.error('[Map] Error event:', e);
      });
      map.current.on('click', clickEvent => {
        map.current?.panTo(clickEvent.lngLat);
      });
      const scale = new ScaleControl({
        maxWidth: 80,
        unit: 'metric',
      });
      map.current.addControl(scale, 'bottom-left');
    }

    map.current.on('move', () => {
      if (!map.current) return;
      const { lat, lng } = map.current.getCenter();
      const features = map.current.queryRenderedFeatures(map.current.project([lng, lat]));
      // new maplibregl.Marker()
      //   .setLngLat([lng,lat])
      //   .addTo(map.current);
      if (features.length > 0) {
        let feature;
        if (loadedMapType === 'rocks') {
          feature = features.find(f => f.sourceLayer === 'rock_units');
        }
        else {
          feature = (
            features.find(f => f.sourceLayer === 'waterways')
            || features.find(f => f.sourceLayer === 'waterbodies')
            || features.find(f => f.sourceLayer === 'watersheds')
          );
        }
        setMapFeature(feature);
      }
      else {
        setMapFeature(undefined);
      }
    });
  }, [loadedMapType, log, map, mapContainer]);

  useEffect(() => {
    if (!loadedMapType) return;
    if (!mapFeature) {
      setUnderfootFeature(undefined);
      return;
    }
    if (loadedMapType === 'rocks') {
      if (underfootFeatures && mapFeature.properties.id) {
        const feature = underfootFeatures[parseInt(String(mapFeature.properties.id), 10)];
        if (citations && feature?.source && !feature.citation) {
          feature.citation = citations[feature.source];
        }
        setUnderfootFeature(feature);
      }
      else {
        setUnderfootFeature(undefined);
      }
    }
    else {
      const newUnderfootFeature: WaterFeature = {
        id: Number(mapFeature.properties.source_id),
        source: String(mapFeature.properties.source),
        layer: String(mapFeature.sourceLayer),
      };
      if (mapFeature.properties.name) newUnderfootFeature.title = mapFeature.properties.name as string;
      if (citations && newUnderfootFeature.source) {
        newUnderfootFeature.citation = citations[newUnderfootFeature.source];
      }
      setUnderfootFeature(newUnderfootFeature);
    }
  }, [
    citations,
    loadedMapType,
    mapFeature,
    underfootFeatures,
  ]);

  useEffect(() => {
    async function changePack() {
      log('changePack');
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
      let packData;
      try {
        packData = await currentPack.unzippedData();
      }
      catch (e) {
        const unzipError = e as Error;
        log(`changePack failed to unzip: ${unzipError.message}`);
        throw unzipError;
      }

      // Load ways
      if (!packData.ways_pmtiles) throw new Error(`Pack ${currentPackId} did not have ways data`);
      let waysPmtiles;
      try {
        waysPmtiles = new pmtiles.PMTiles(
          new pmtiles.FileSource(
            // The filename is important b/c it's a key that we use to refer to
            // this "protocol" in the sources
            new File([packData.ways_pmtiles], 'ways'),
          ),
        );
        protocol.add(waysPmtiles);
        // Validate that PMTiles is actually accessible
        await waysPmtiles.getHeader();
        log(`Successfully loaded ways PMTiles for pack ${currentPackId}`);
      }
      catch (waysError) {
        const error = waysError as Error;
        log(`Failed to load ways PMTiles: ${error.message}`);
        throw new Error(`Failed to load ways data for pack ${currentPackId}: ${error.message}`);
      }

      // Load contours
      if (!packData.contours_pmtiles) throw new Error(`Pack ${currentPackId} did not have contours data`);
      let contoursPmtiles;
      try {
        contoursPmtiles = new pmtiles.PMTiles(
          new pmtiles.FileSource(
            // The filename is important b/c it's a key that we use to refer to
            // this "protocol" in the sources
            new File([packData.contours_pmtiles], 'contours'),
          ),
        );
        protocol.add(contoursPmtiles);
        // Validate that PMTiles is actually accessible
        await contoursPmtiles.getHeader();
        log(`Successfully loaded contours PMTiles for pack ${currentPackId}`);
      }
      catch (contoursError) {
        const error = contoursError as Error;
        log(`Failed to load contours PMTiles: ${error.message}`);
        throw new Error(`Failed to load contours data for pack ${currentPackId}: ${error.message}`);
      }

      // Load context
      if (!packData.context_pmtiles) throw new Error(`Pack ${currentPackId} did not have context data`);
      let contextPmtiles;
      try {
        contextPmtiles = new pmtiles.PMTiles(
          new pmtiles.FileSource(
            // The filename is important b/c it's a key that we use to refer to
            // this "protocol" in the sources
            new File([packData.context_pmtiles], 'context'),
          ),
        );
        protocol.add(contextPmtiles);
        // Validate that PMTiles is actually accessible
        await contextPmtiles.getHeader();
        log(`Successfully loaded context PMTiles for pack ${currentPackId}`);
      }
      catch (contextError) {
        const error = contextError as Error;
        log(`Failed to load context PMTiles: ${error.message}`);
        throw new Error(`Failed to load context data for pack ${currentPackId}: ${error.message}`);
      }

      log(`Calling loadMapFromPackData for ${mapType}`);
      loadMapFromPackData(
        packData,
        protocol,
        map.current,
        mapType,
        setUnderfootFeatures,
        setCitations,
      );

      // Track style loading completion
      void map.current.once('styledata', () => {
        log(`Map styledata event fired for pack ${currentPackId}`);
      });

      void map.current.once('style.load', () => {
        log(`Map style.load event fired for pack ${currentPackId}`);
      });

      const waysHeader = await waysPmtiles.getHeader();
      map.current.setZoom(waysHeader.maxZoom - 2);
      // map.current.on('zoom', () => {
      //   console.log('[DEBUG Map.tsx] map.current.getZoom(): ', map.current?.getZoom());
      // });
      map.current.setCenter([waysHeader.centerLon, waysHeader.centerLat]);
      setLoadedPackId(currentPackId);
      setLoadedMapType(mapType);
      setPackLoading(false);
    }
    if (
      packStore
      && (currentPackId !== loadedPackId || mapType !== loadedMapType)
      && map.current
    ) {
      changePack().catch(e => {
        const error = e as Error;
        alert(`Failed to change to pack ${currentPackId}: ${error.message}`);
        log(error.message);
        console.error(`Failed to change to pack ${currentPackId}`, error);
      });
    }
  }, [
    log,
    currentPackId,
    loadedMapType,
    loadedPackId,
    mapLoaded,
    mapType,
    packLoading,
    packStore,
  ]);

  return (
    <div className="map-wrapper">
      <div className={`map ${loadedPackId ? 'loaded' : ''}`} ref={mapContainer} />
      <CurrentLocationButton map={map.current} />
      { loadedPackId && (
        <>
          <AddIcon fontSize="large" className="add-icon" style={{ pointerEvents: 'none' }} />
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
  );
}
