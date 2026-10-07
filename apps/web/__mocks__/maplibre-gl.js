'use strict';
// Manual mock for maplibre-gl (ESM-only module — mocked for Jest CJS compatibility)
const Map = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
  once: jest.fn(function(event, cb) { if (typeof cb === 'function') cb(); return this; }),
  off: jest.fn(),
  flyTo: jest.fn(),
  easeTo: jest.fn(),
  fitBounds: jest.fn(),
  setZoom: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  getZoom: jest.fn().mockReturnValue(14),
  getCenter: jest.fn().mockReturnValue({ lat: 32.7157, lng: -117.1611 }),
  getBounds: jest.fn().mockReturnValue({
    getSouth: () => 32.65,
    getWest: () => -117.25,
    getNorth: () => 32.78,
    getEast: () => -117.07,
  }),
  addSource: jest.fn(),
  getSource: jest.fn().mockReturnValue(null),
  addLayer: jest.fn(),
  getLayer: jest.fn().mockReturnValue(null),
  removeLayer: jest.fn(),
  removeSource: jest.fn(),
  remove: jest.fn(),
  panTo: jest.fn(),
  setStyle: jest.fn(),
  isStyleLoaded: jest.fn().mockReturnValue(true),
  setPaintProperty: jest.fn(),
}));

const Marker = jest.fn().mockImplementation(function(opts) {
  this.opts = opts;
  this.element = opts?.element || (typeof document !== 'undefined' ? document.createElement('div') : null);
  this.setLngLat = jest.fn().mockReturnThis();
  this.addTo = jest.fn().mockImplementation(function(map) {
    this.map = map;
    return this;
  });
  this.remove = jest.fn();
  this.getElement = jest.fn().mockReturnValue(this.element);
  return this;
});

module.exports = { Map, Marker, default: { Map, Marker } };