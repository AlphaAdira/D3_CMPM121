// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

// Create basic UI elements

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// Our classroom location
const START_LATLNG = leaflet.latLng(
  33.908446206094084,
  -118.35886037575585,
);

let heldToken: number | null = null;
const GAMEPLAY_ZOOM_LEVEL = 19;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: START_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Interaction range in grid cells
const REACH = 3;

// Size of one cell in degrees
const CELL_SIZE = 0.0001;

// Calculate bounds of the reachable area (3x3 grid around center)
const reachDistance = REACH * CELL_SIZE;

const reachableBounds = leaflet.latLngBounds(
  [START_LATLNG.lat - reachDistance, START_LATLNG.lng - reachDistance],
  [START_LATLNG.lat + reachDistance, START_LATLNG.lng + reachDistance],
);

// Draw the visibility box
leaflet.rectangle(reachableBounds, {
  color: "white",
  weight: 2,
  fillOpacity: 0.1,
  dashArray: "8, 8", // dotted line
}).addTo(map);

const playerMarker = leaflet.marker(START_LATLNG);
playerMarker.bindTooltip("YOU");
playerMarker.addTo(map);

interface Token {
  value: number;
  rect: leaflet.Rectangle;
  marker: leaflet.Marker;
}

function addTokens(centerLat: number, centerLng: number) {
  const rows = 10, cols = 30;
  for (let i = -rows; i <= rows; i++) {
    for (let j = -cols; j <= cols; j++) {
      const cellLat = centerLat + i * CELL_SIZE;
      const cellLng = centerLng + j * CELL_SIZE;
      const bounds = leaflet.latLngBounds(
        [cellLat, cellLng],
        [cellLat + CELL_SIZE, cellLng + CELL_SIZE],
      );

      // ✅ Use integer grid indices for deterministic luck
      if (hasToken(i, j)) {
        const aToken: Token = {
          value: 1,
          rect: leaflet.rectangle(bounds).addTo(map),
          marker: leaflet.marker([cellLat, cellLng], {
            icon: leaflet.divIcon({
              html: `<span>1</span>`,
              className: "token-icon",
              iconSize: [40, 50],
              iconAnchor: [0, 50],
            }),
          }).addTo(map),
        };
        if (i >= -REACH && i < REACH && j >= -REACH && j < REACH) {
          aToken.marker.on("click", () => {
            console.log("Cell clicked!", i, j);
            if (heldToken !== null) {
              aToken.value += heldToken;
              heldToken = null;
              updateInventory();
              const labelSpan = aToken.marker.getElement()?.querySelector(
                "span",
              );
              if (labelSpan) {
                labelSpan.innerHTML = aToken.value.toString();
              }
            } else {
              heldToken = aToken.value;
              updateInventory();
              checkWin();
              aToken.rect.remove();
              aToken.marker.remove();
            }
          });
        }
      }
    }
  }
}

addTokens(START_LATLNG.lat, START_LATLNG.lng);

function hasToken(i: number, j: number): boolean {
  return luck(`cell-${i}-${j}`) < 0.3; //amount of tokens
}

const inventoryEl = document.createElement("div");
inventoryEl.id = "inventory";
inventoryEl.textContent = heldToken ? `Held: ${heldToken}` : "Held: none";
document.body.appendChild(inventoryEl);

function updateInventory() {
  inventoryEl.textContent = heldToken
    ? `Held: Token with value of ${heldToken}`
    : "Held: none";
}

function checkWin() {
  if (heldToken !== null && heldToken >= 8) {
    statusPanelDiv.textContent = "🎉 You win! Token value: " + heldToken;
  }
}
