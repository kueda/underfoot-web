import {useEffect, useRef, useState} from 'react';
import maplibregl, { Map, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from "pmtiles";
import Modal from '@mui/material/Modal';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';

import MapBottomSheet from './MapBottomSheet';
import { usePackStore } from './PackStore';
import { ROCK_STYLE } from './mapStyles';

// add the PMTiles plugin to the maplibregl global.
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', (request) => {
  return new Promise((resolve, reject) => {
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
  currentPackId?: string
}

export default function UnderfootMap({currentPackId}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map>();
  const packStore = usePackStore( );
  const [loadedPackId, setLoadedPackId] = useState<string>();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [packLoading, setPackLoading] = useState(false);
  const [feature, setFeature] = useState<MapGeoJSONFeature>();

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
      if ( features.length > 0 ) {
        setFeature(features.find(f => f.sourceLayer === 'rock_units'));
      } else {
        setFeature(undefined);
      }
    })
  }, [map, mapContainer] );

  useEffect( ( ) => {
    async function changePack() {
      if (!currentPackId) return;
      if (currentPackId === loadedPackId) return;
      if (!map.current) return;
      const currentPack = await packStore.get(currentPackId);
      if (!currentPack) return;
      setPackLoading(true);
      const packData = await currentPack.unzippedData();
      if (!packData.ways) throw new Error(`Pack ${currentPackId} did not have ways data`);
      const waysPmtiles = new pmtiles.PMTiles(
        new pmtiles.FileSource(
          // The filename is important b/c it's a key that we use to refer to
          // this "protocol" in the sources
          new File( [packData.ways], "ways" )
        )
      );
      protocol.add(waysPmtiles);
      if (!packData.rocks) throw new Error(`Pack ${currentPackId} did not have rocks data`);
      const rocksPmtiles = new pmtiles.PMTiles(
        new pmtiles.FileSource(new File([packData.rocks], "rocks"))
      );
      protocol.add(rocksPmtiles);
      map.current.setStyle(ROCK_STYLE);
      const waysHeader = await waysPmtiles.getHeader( );
      map.current.setZoom(waysHeader.maxZoom - 2);
      map.current.setCenter([waysHeader.centerLon, waysHeader.centerLat])
      setLoadedPackId(currentPackId);
      setPackLoading(false);
    }
    if (
      packStore
      && currentPackId
      && currentPackId !== loadedPackId
      && map.current
    ) {
      changePack().catch(e => console.error(`Failed to change to pack ${currentPackId}`, e));
    }
  }, [
    packStore,
    currentPackId,
    mapLoaded,
    loadedPackId
  ])

  return (
    <div className='map-wrapper'>
      <div className="map" ref={mapContainer} />
      <AddIcon fontSize='large' className="add-icon" />
      <MapBottomSheet feature={feature} />
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
