import React from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import MapBottomSheet from './MapBottomSheet';

export default function UnderfootMap() {
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
      <MapBottomSheet />
    </div>
  )
}
