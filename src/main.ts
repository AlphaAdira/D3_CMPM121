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

let heldToken: number | null = null;
const GAMEPLAY_ZOOM_LEVEL = 19;

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const inventoryEl = document.createElement("div");
inventoryEl.id = "inventory";
inventoryEl.textContent = heldToken ? `Held: ${heldToken}` : "Held: none";
document.body.appendChild(inventoryEl);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

const westBtn = document.createElement("button");
westBtn.id = "west";
westBtn.textContent = "⬅️";
document.body.append(westBtn);

const northBtn = document.createElement("button");
northBtn.id = "north";
northBtn.textContent = "⬆️";
document.body.append(northBtn);

const southBtn = document.createElement("button");
southBtn.id = "south";
southBtn.textContent = "⬇️";
document.body.append(southBtn);

const eastBtn = document.createElement("button");
eastBtn.id = "east";
eastBtn.textContent = "➡️";
document.body.append(eastBtn);

// Our start location
const START_LATLNG = leaflet.latLng(
  33.908446206094084,
  -118.35886037575585,
);

// player location
let PLAYER_LATLNG = START_LATLNG;

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

// Convert lat/lng → grid coordinates (whole numbers)
function latToGrid(lat: number): number {
  return Math.floor(lat / CELL_SIZE);
}
function lngToGrid(lng: number): number {
  return Math.floor(lng / CELL_SIZE);
}

// Convert grid → lat/lng (southwest corner of cell)
function gridToLat(gridI: number): number {
  return gridI * CELL_SIZE;
}
function gridToLng(gridJ: number): number {
  return gridJ * CELL_SIZE;
}

let reachRect: leaflet.Rectangle | null = null;
function updateReachRectangle() {
  const reachDistance = (REACH + 0.5) * CELL_SIZE;
  const bounds = leaflet.latLngBounds(
    [PLAYER_LATLNG.lat - reachDistance, PLAYER_LATLNG.lng - reachDistance],
    [PLAYER_LATLNG.lat + reachDistance, PLAYER_LATLNG.lng + reachDistance],
  );

  if (reachRect) {
    // Update existing rectangle
    reachRect.setBounds(bounds);
  } else {
    // First time: create and add
    reachRect = leaflet.rectangle(bounds, {
      color: "white",
      weight: 2,
      fillOpacity: 0.1,
      dashArray: "8, 8",
    }).addTo(map);
  }
}

const orginMarker = leaflet.marker(START_LATLNG);
orginMarker.bindTooltip("orgin");
orginMarker.addTo(map);

const playerMarker = leaflet.marker(PLAYER_LATLNG);
playerMarker.bindTooltip("YOU");
playerMarker.addTo(map);

interface Token {
  value: number;
  rect: leaflet.Rectangle;
  marker: leaflet.Marker;
}

const renderCache = new Map<string, Token>();

function addTokens(centerLat: number, centerLng: number) {
  const centerI = latToGrid(centerLat);
  const centerJ = lngToGrid(centerLng);
  const viewRadius = 10;

  for (let di = -viewRadius; di <= viewRadius; di++) {
    for (let dj = -viewRadius * 3; dj <= viewRadius * 3; dj++) {
      const gridI = centerI + di;
      const gridJ = centerJ + dj;
      const key = `${gridI},${gridJ}`;

      if (renderCache.has(key)) continue;
      if (!hasToken(gridI, gridJ)) continue;

      const token = createTokenAt(gridI, gridJ);
      renderCache.set(key, token);

      if (isInReach(di, dj)) {
        setupTokenClick(token, key);
      }
    }
  }
}

function createTokenAt(i: number, j: number): Token {
  const cellLat = gridToLat(i);
  const cellLng = gridToLng(j);
  const bounds = leaflet.latLngBounds(
    [cellLat, cellLng],
    [cellLat + CELL_SIZE, cellLng + CELL_SIZE],
  );

  return {
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
}
function isInReach(di: number, dj: number): boolean {
  return Math.abs(di) <= REACH && Math.abs(dj) <= REACH;
}
function setupTokenClick(token: Token, key: string) {
  token.marker.on("click", () => {
    if (heldToken !== null && heldToken === token.value) {
      // Merge
      token.value += heldToken;
      heldToken = null;
      updateInventory();
      updateTokenDisplay(token);
    } else if (heldToken !== null) {
      // Swap
      const temp = heldToken;
      heldToken = token.value;
      token.value = temp;
      updateInventory();
      updateTokenDisplay(token);
    } else {
      // Pick up
      heldToken = token.value;
      updateInventory();
      token.rect.remove();
      token.marker.remove();
      renderCache.delete(key);
      checkWin();
    }
  });
}

function updateTokenDisplay(token: Token) {
  const span = token.marker.getElement()?.querySelector("span");
  if (span) span.innerHTML = token.value.toString();
}

addTokens(PLAYER_LATLNG.lat, PLAYER_LATLNG.lng);
updateReachRectangle();

function hasToken(i: number, j: number): boolean {
  return luck(`cell-${i}-${j}`) < 0.3; //amount of tokens
}

function updateInventory() {
  inventoryEl.textContent = heldToken
    ? `Held: Token with value of ${heldToken}`
    : "Held: none";
}

function checkWin() {
  if (heldToken !== null && heldToken >= 12) {
    alert(
      `"🎉 You win! Token value: ${heldToken}`,
    );
  }
}

//Buttons code
const North = document.getElementById("north");
const South = document.getElementById("south");
const East = document.getElementById("east");
const West = document.getElementById("west");

North!.addEventListener("click", northFunction);
function northFunction() {
  updatePlayer(PLAYER_LATLNG.lat + CELL_SIZE, PLAYER_LATLNG.lng);
}

South!.addEventListener("click", southFunction);
function southFunction() {
  updatePlayer(PLAYER_LATLNG.lat - CELL_SIZE, PLAYER_LATLNG.lng);
}

East!.addEventListener("click", eastFunction);
function eastFunction() {
  updatePlayer(PLAYER_LATLNG.lat, PLAYER_LATLNG.lng + CELL_SIZE);
}

West!.addEventListener("click", westFunction);
function westFunction() {
  updatePlayer(PLAYER_LATLNG.lat, PLAYER_LATLNG.lng - CELL_SIZE);
}

function updatePlayer(lat: number, lng: number) {
  // === Remove all old tokens ===
  for (const [_key, token] of renderCache.entries()) {
    token.rect.remove();
    token.marker.remove();
  }
  renderCache.clear();

  // === Update player ===
  PLAYER_LATLNG = leaflet.latLng(lat, lng);
  playerMarker.setLatLng(PLAYER_LATLNG);
  map.setView(PLAYER_LATLNG); // make map follow player

  // === Draw new tokens around new location ===
  addTokens(PLAYER_LATLNG.lat, PLAYER_LATLNG.lng);
  updateReachRectangle();
}
