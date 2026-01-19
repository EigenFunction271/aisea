// Inspect DottedMap SVG structure
// Run with: node inspect-dottedmap.mjs

import DottedMap from 'dotted-map';
// Try default import, if that fails, try named import
const MapClass = DottedMap.default || DottedMap;
import fs from 'fs';

const map = new MapClass({ height: 100, grid: "diagonal" });
const svg = map.getSVG({
  radius: 0.22,
  color: "#FFFF7F40",
  shape: "circle",
  backgroundColor: "black",
});

console.log("=== DottedMap SVG Inspection ===\n");

// Extract viewBox
const viewBoxMatch = svg.match(/viewBox=['"]([^'"]+)['"]/);
if (viewBoxMatch) {
  console.log("viewBox:", viewBoxMatch[1]);
  const [x, y, width, height] = viewBoxMatch[1].split(' ').map(Number);
  console.log(`  x: ${x}, y: ${y}, width: ${width}, height: ${height}`);
  console.log(`  Aspect ratio: ${width}:${height} = ${(width/height).toFixed(2)}:1`);
}

// Extract width and height attributes
const widthMatch = svg.match(/width=['"]([^'"]+)['"]/);
const heightMatch = svg.match(/height=['"]([^'"]+)['"]/);
if (widthMatch) console.log("\nwidth attribute:", widthMatch[1]);
if (heightMatch) console.log("height attribute:", heightMatch[1]);

// Check for coordinate system hints
console.log("\n=== Coordinate System Analysis ===");
if (viewBoxMatch) {
  const [x, y, width, height] = viewBoxMatch[1].split(' ').map(Number);
  console.log(`For equirectangular projection:`);
  console.log(`  Longitude [-180, 180] maps to x [${x}, ${x + width}]`);
  console.log(`  Latitude [-90, 90] maps to y [${y}, ${y + height}]`);
  console.log(`  Formula: x = ${x} + (lng + 180) * ${width} / 360`);
  console.log(`  Formula: y = ${y} + (90 - lat) * ${height} / 180`);
}

// Test projection for known locations
console.log("\n=== Test Projections ===");
if (viewBoxMatch) {
  const [x, y, width, height] = viewBoxMatch[1].split(' ').map(Number);
  
  const project = (lat, lng) => {
    const px = x + (lng + 180) * (width / 360);
    const py = y + (90 - lat) * (height / 180);
    return { x: px, y: py };
  };
  
  const locations = [
    { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
    { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Brisbane", lat: -27.4698, lng: 153.0251 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  ];
  
  locations.forEach(loc => {
    const proj = project(loc.lat, loc.lng);
    console.log(`${loc.name} (${loc.lat}, ${loc.lng}): x=${proj.x.toFixed(2)}, y=${proj.y.toFixed(2)}`);
  });
}

// Compare with current WORLD_WIDTH/HEIGHT constants
console.log("\n=== Comparison with Current Constants ===");
const WORLD_WIDTH = 200;
const WORLD_HEIGHT = 100;
console.log(`Current: WORLD_WIDTH=${WORLD_WIDTH}, WORLD_HEIGHT=${WORLD_HEIGHT}`);

const currentProject = (lat, lng) => {
  const px = (lng + 180) * (WORLD_WIDTH / 360);
  const py = (90 - lat) * (WORLD_HEIGHT / 180);
  return { x: px, y: py };
};

const locations = [
  { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869 },
];

locations.forEach(loc => {
  const proj = currentProject(loc.lat, loc.lng);
  console.log(`${loc.name}: x=${proj.x.toFixed(2)}, y=${proj.y.toFixed(2)}`);
});

// Save SVG to file for visual inspection
fs.writeFileSync('./dottedmap-output.svg', svg);
console.log("\n=== SVG saved to ./dottedmap-output.svg for visual inspection ===");
console.log("You can open this file in a browser to see the map structure");
