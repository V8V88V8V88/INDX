
import fs from 'fs';
import path from 'path';

const filePath = path.resolve("public/geo/states/DL.json");
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

data.features.forEach((f: any, i: number) => {
    let coords = [];
    if (f.geometry.type === "Polygon") {
        coords = f.geometry.coordinates[0];
    } else if (f.geometry.type === "MultiPolygon") {
        coords = f.geometry.coordinates[0][0]; // Check first polygon of multipolygon
    }

    // Check bounds
    coords.forEach((pt: any) => {
        const [x, y] = pt;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    });

    // Check signed area for winding (Shoelace formula)
    let area = 0;
    for (let j = 0; j < coords.length; j++) {
        const [x1, y1] = coords[j];
        const [x2, y2] = coords[(j + 1) % coords.length];
        area += (x2 - x1) * (y2 + y1);
    }
    // If area > 0 (in standard cartesian), it's CW (Clockwise)
    // If area < 0, it's CCW (Counter-Clockwise)
    // Note: GeoJSON spec says exterior rings should be CCW.

    console.log(`Feature ${i} (${f.properties.district}): Area Sign=${Math.sign(area)} (${area > 0 ? 'CW' : 'CCW'})`);
});

console.log(`Overall Bounds: [${minX}, ${minY}] to [${maxX}, ${maxY}]`);
