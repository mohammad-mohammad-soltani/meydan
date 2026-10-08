const fs = require('fs');
const V = process.argv[2], OUT = process.argv[3];
const topo = require(V + '/topojson-client-3.1.0/package/dist/topojson-client.js');
const r = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const roundGeom = (coords, d) => Array.isArray(coords[0]) ? coords.map(c => roundGeom(c, d)) : [r(coords[0], d), r(coords[1], d)];
const land = JSON.parse(fs.readFileSync(V + '/world-atlas-2.0.2/package/land-110m.json'));
const landGeo = topo.feature(land, land.objects.land);
const landGeom = landGeo.features ? landGeo.features[0].geometry : landGeo.geometry;
const c50 = JSON.parse(fs.readFileSync(V + '/world-atlas-2.0.2/package/countries-50m.json'));
const countries = topo.feature(c50, c50.objects.countries);
const iran = countries.features.find(f => f.id === '364');
const map = JSON.parse(fs.readFileSync(require('path').join(__dirname, '../../public/maps/iran-svg-map.json')));
const l50 = JSON.parse(fs.readFileSync(V + '/world-atlas-2.0.2/package/land-50m.json'));
const l50g = topo.feature(l50, l50.objects.land);
const g50 = l50g.features ? l50g.features[0].geometry : l50g.geometry;
const polys = (g50.type === 'MultiPolygon' ? g50.coordinates : [g50.coordinates]).map(poly => poly.map(ring => {
  const out = []; for (const [x, y] of ring) { const q = [r(x, 2), r(y, 2)]; const l = out[out.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) out.push(q); }
  return out;
})).filter(poly => poly[0].some(([x, y]) => x > 28 && x < 78 && y > 12 && y < 52));
const out = {
  landHi: { type: 'MultiPolygon', coordinates: polys },
  land: { type: landGeom.type, coordinates: roundGeom(landGeom.coordinates, 2) },
  iran: { type: iran.geometry.type, coordinates: roundGeom(iran.geometry.coordinates, 3) },
  provs: map.provs.map(p => ({ fa: p.fa, c: p.c, paths: p.paths })),
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('iran', iran.properties, 'bytes', fs.statSync(OUT).size);
