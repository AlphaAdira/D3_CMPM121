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

const CELL_SIZE = 0.0001;

const playerMarker = leaflet.marker(START_LATLNG);
playerMarker.bindTooltip("YOU");
playerMarker.addTo(map);

interface Token {
  value: number;
  rect: leaflet.Rectangle;
  marker: leaflet.Marker;
}

function drawGrid(centerLat: number, centerLng: number) {
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
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
          }).addTo(map),
        };
        const distance = Math.max(Math.abs(i), Math.abs(j));
        if (distance <= 3) {
          aToken.rect.on("click", () => {
            console.log("Cell clicked!", i, j);
            if (heldToken !== null) {
              aToken.value += heldToken;
              heldToken = 0;
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

drawGrid(START_LATLNG.lat, START_LATLNG.lng);

function hasToken(i: number, j: number): boolean {
  return luck(`cell-${i}-${j}`) < 0.3;
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
