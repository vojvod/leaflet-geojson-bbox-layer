import L from 'leaflet'; // eslint-disable-line no-unused-vars
import geojsonBboxLayer from './geojsonBboxLayer';

describe('Leaflet geojson bbox layer', () => {
  let map;
  let fetchRequest;
  let listeners;

  beforeEach(() => {
    listeners = {};
    map = {
      on: jest.fn((event, callback) => {
        listeners[event] = callback;
      }),
      off: jest.fn(),
      getBounds: jest.fn(),
      getZoom: jest.fn(),
    };
    map.getZoom.mockReturnValue(5);

    const paddedBounds = { toBBoxString: () => '1,2,3,4' };
    map.getBounds.mockReturnValue({ pad: () => paddedBounds});

    fetchRequest = jest.fn(() => Promise.resolve());
  });

  it('should fetch data on add to map', (done) => {
    const layer = new geojsonBboxLayer({ fetchRequest });
    layer.addData = jest.fn();
    layer.clearLayers = jest.fn();
    const geoData = { foo: 'bar' };
    const prom = Promise.resolve(geoData);
    fetchRequest.mockReturnValue(prom);

    layer.onAdd(map);

    expect(map.on).toHaveBeenCalled();
    expect(fetchRequest).toHaveBeenCalledWith('1,2,3,4');
    prom.then(() => {
      expect(layer.clearLayers).toHaveBeenCalled();
      expect(layer.addData).toHaveBeenCalledWith(geoData);
      done();
    });
  });

  it('should remove listeners on removal', () => {
    const layer = new geojsonBboxLayer({ fetchRequest });
    layer.onAdd(map);

    layer.onRemove(map);

    expect(map.off).toHaveBeenCalledTimes(3);
  });

  it('should fetch data on move end', () => {
    const layer = new geojsonBboxLayer({ fetchRequest });
    layer.onAdd(map);
    fetchRequest.mockClear();

    listeners.moveend.bind(layer)();

    expect(fetchRequest).toHaveBeenCalledWith('1,2,3,4');
  });

  it('should fetch data on refresh', () => {
    const layer = new geojsonBboxLayer({ fetchRequest });
    layer.onAdd(map);
    fetchRequest.mockClear();

    listeners.refresh.bind(layer)();

    expect(fetchRequest).toHaveBeenCalledWith('1,2,3,4');
  });

  it('should do nothing on zoom end if inside range', () => {
    const layer = new geojsonBboxLayer({ fetchRequest });
    layer.onAdd(map);
    layer.clearLayers = jest.fn();

    listeners.zoomend.bind(layer)();

    expect(layer.clearLayers).not.toHaveBeenCalled();
  });

  it('should clear data if outside zoom range', () => {
    const layer = new geojsonBboxLayer({ fetchRequest });
    layer.onAdd(map);
    layer.clearLayers = jest.fn();
    map.getZoom.mockReturnValue(100);

    listeners.zoomend.bind(layer)();

    expect(layer.clearLayers).toHaveBeenCalled();
  });

  it('should check if zoom is in range', () => {
    map.getZoom.mockReturnValue(10);

    const layer = new geojsonBboxLayer({ fetchRequest });
    layer.onAdd(map);
    expect(layer._zoomInRange()).toBe(true);

    const layerMin = new geojsonBboxLayer({ fetchRequest, zoomMin: 12 });
    layerMin.onAdd(map);
    expect(layerMin._zoomInRange()).toBe(false);

    const layerMax = new geojsonBboxLayer({ fetchRequest, zoomMax: 8 });
    layerMax.onAdd(map);
    expect(layerMax._zoomInRange()).toBe(false);
  });
});
