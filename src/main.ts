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
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

let heldToken: number | null = null;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map("map").setView(CLASSROOM_LATLNG, 18);
leaflet
  .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
  .addTo(map);

const CELL_SIZE = 0.0001;

function drawGrid(centerLat: number, centerLng: number) {
  const rows = 5, cols = 5;
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
        const rect = leaflet.rectangle(bounds, { color: "blue" }).addTo(map);
        rect.on("click", () => {
          console.log("Cell clicked!", i, j);
          if (heldToken !== null) {
            //change later
            heldToken++;
            updateInventory();
            checkWin();
            rect.remove();
          } else {
            heldToken = 1;
            updateInventory();
            checkWin();
            rect.remove();
          }
        });
      }
    }
  }
}
drawGrid(36.9979, -122.0570);

function hasToken(i: number, j: number): boolean {
  return luck(`cell-${i}-${j}`) < 0.3;
}

const inventoryEl = document.createElement("div");
inventoryEl.id = "inventory";
inventoryEl.textContent = heldToken ? `Held: ${heldToken}` : "Held: none";
document.body.appendChild(inventoryEl);

function updateInventory() {
  inventoryEl.textContent = heldToken ? `Held: ${heldToken}` : "Held: none";
}

function checkWin() {
  if (heldToken !== null && heldToken >= 8) {
    statusPanelDiv.textContent = "🎉 You win! Token value: " + heldToken;
  }
}
