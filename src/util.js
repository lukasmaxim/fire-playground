import * as d3 from 'd3'

// converts degrees to radians
export function degToRad(deg) {
  return deg * Math.PI / 180
}

export function findCoordinateExtent(powerEntries) {
  var maxX = d3.max(powerEntries, powerEntry => {
    return powerEntry.longitude;
  });

  var minX = d3.min(powerEntries, powerEntry => {
    return powerEntry.longitude;
  });

  var maxY = d3.max(powerEntries, powerEntry => {
    return powerEntry.latitude;
  });

  var minY = d3.min(powerEntries, powerEntry => {
    return powerEntry.latitude;
  });

  return [minX, maxX, minY, maxY];
}