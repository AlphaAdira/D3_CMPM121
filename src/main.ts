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

document.body.appendChild(document.createElement("br"));

const newGameBtn = document.createElement("button");
newGameBtn.id = "newGame";
newGameBtn.textContent = "✨ New Game";
document.body.appendChild(newGameBtn);

let START_LATLNG: leaflet.LatLng | null = null;
let PLAYER_LATLNG: leaflet.LatLng | null = null;
let watchId: number | null = null;
let map: leaflet.Map;

function startGeolocationTracking() {
  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const latLng = leaflet.latLng(latitude, longitude);

      // ✅ Set on first update
      if (START_LATLNG === null) {
        START_LATLNG = latLng;
        PLAYER_LATLNG = latLng;

        // 🟢 Initialize ONLY here
        initializeMap(START_LATLNG);
        createOriginMarker(START_LATLNG);
        createPlayerMarker(START_LATLNG);
      }

      // Always update player movement
      updatePlayer(latitude, longitude);
    },
    (error) => console.error("Geo error:", error),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
  );
}

function stopGeolocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// Create the map (element with id "map" is defined in index.html)
function initializeMap(center: leaflet.LatLng) {
  map = leaflet.map(mapDiv, {
    center: center,
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
}

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
  if (PLAYER_LATLNG === null) return;
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

function createOriginMarker(pos: leaflet.LatLng) {
  const originMarker = leaflet.marker(pos).addTo(map);
  originMarker.bindTooltip("origin");
}

let playerMarker: leaflet.Marker;
function createPlayerMarker(pos: leaflet.LatLng) {
  playerMarker = leaflet.marker(pos).addTo(map);
  playerMarker.bindTooltip("YOU");
  PLAYER_LATLNG = pos;
}

let prevCenterI: number | null = null;
let prevCenterJ: number | null = null;

interface Token {
  value: number;
  rect: leaflet.Rectangle;
  marker: leaflet.Marker;
}
interface CellState {
  hasToken: boolean;
  value: number;
}
const cellMemory = new Map<string, CellState>();

const renderTokens = new Map<string, Token>();

const radius = 5;

function addTokens(centerLat: number, centerLng: number) {
  const centerI = latToGrid(centerLat);
  const centerJ = lngToGrid(centerLng);

  for (let di = -radius; di <= radius; di++) {
    for (let dj = -radius * 3; dj <= radius * 3; dj++) {
      const gridI = centerI + di;
      const gridJ = centerJ + dj;
      const key = `${gridI},${gridJ}`;

      if (renderTokens.has(key)) continue;
      if (!hasToken(gridI, gridJ)) continue;

      const token = createTokenAt(gridI, gridJ);
      if (token) {
        renderTokens.set(key, token);
      }

      if (isInReach(di, dj) && token) {
        setupTokenClick(token, key, gridI, gridJ);
      }
    }
  }
  prevCenterI = centerI;
  prevCenterJ = centerJ;
}

function createTokenAt(i: number, j: number): Token | null {
  const key = `${i},${j}`;
  const state = cellMemory.get(key);
  let sendValue = 1;

  if (state !== undefined) {
    if (!state.hasToken) {
      return null; // No token allowed
    }
    sendValue = state.value;
  } else if (luck(`cell-${i}-${j}`) >= 0.3) {
    return null;
  }

  const cellLat = gridToLat(i);
  const cellLng = gridToLng(j);
  const bounds = leaflet.latLngBounds(
    [cellLat, cellLng],
    [cellLat + CELL_SIZE, cellLng + CELL_SIZE],
  );

  return {
    value: sendValue,
    rect: leaflet.rectangle(bounds).addTo(map),
    marker: leaflet.marker([cellLat, cellLng], {
      icon: leaflet.divIcon({
        html: `<span>${sendValue}</span>`,
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
function setupTokenClick(
  token: Token,
  key: string,
  gridI: number,
  gridJ: number,
) {
  token.marker.on("click", () => {
    if (heldToken !== null && heldToken === token.value) {
      // Merge
      token.value += heldToken;
      heldToken = null;
      cellMemory.set(`${gridI},${gridJ}`, {
        hasToken: true,
        value: token.value,
      });
      updateInventory();
      saveGameState();
      updateTokenDisplay(token);
    } else if (heldToken !== null) {
      // Swap
      const temp = heldToken;
      heldToken = token.value;
      token.value = temp;
      cellMemory.set(`${gridI},${gridJ}`, {
        hasToken: true,
        value: token.value,
      });
      updateInventory();
      saveGameState();
      updateTokenDisplay(token);
    } else {
      // Pick up
      heldToken = token.value;
      token.value = 0;
      updateInventory();
      saveGameState();
      cellMemory.set(`${gridI},${gridJ}`, {
        hasToken: false,
        value: token.value,
      });
      token.rect.remove();
      token.marker.remove();
      renderTokens.delete(key);
      checkWin();
    }
  });
}

function updateTokenDisplay(token: Token) {
  const span = token.marker.getElement()?.querySelector("span");
  if (span) span.innerHTML = token.value.toString();
}

function removeTokens(
  currI: number,
  currJ: number,
) {
  const newCells = new Set<string>();
  const oldCells = new Set<string>();

  // Build set of all cell keys in current view
  for (let di = -radius; di <= radius; di++) {
    for (let dj = -radius * 3; dj <= radius * 3; dj++) {
      newCells.add(`${currI + di},${currJ + dj}`);
    }
  }

  // Build set of all cell keys in previous view
  for (let di = -radius; di <= radius; di++) {
    for (let dj = -radius * 3; dj <= radius * 3; dj++) {
      oldCells.add(`${prevCenterI! + di},${prevCenterJ! + dj}`);
    }
  }

  const exited = new Set([...oldCells].filter((key) => !newCells.has(key)));

  for (const key of exited) {
    const token = renderTokens.get(key);
    if (token) {
      token.rect.remove();
      token.marker.remove();
      renderTokens.delete(key);
    }
  }
}

updateReachRectangle();

function hasToken(i: number, j: number): boolean {
  const key = `${i},${j}`;
  const state = cellMemory.get(key);
  if (state !== undefined) {
    return state.hasToken;
  }
  // If not in memory
  return luck(`cell-${i}-${j}`) < 0.3;
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
    stopGeolocationTracking();
  }
}

loadGameState();
startGeolocationTracking();

// Save game state to localStorage
function saveGameState() {
  const state = {
    heldToken,
    playerLat: PLAYER_LATLNG?.lat,
    playerLng: PLAYER_LATLNG?.lng,
    cellValues: Object.fromEntries(
      Array.from(cellMemory.entries()).map((
        [key, { hasToken, value }],
      ) => [key, { hasToken, value }]),
    ),
  };
  localStorage.setItem("d3-game-state", JSON.stringify(state));
  console.log("saved state");
}
// Load game state from localStorage
function loadGameState() {
  const saved = localStorage.getItem("d3-game-state");
  if (saved) {
    console.log("loaded state");
    const state = JSON.parse(saved);
    heldToken = state.heldToken ?? null;
    updateInventory(); // Keep UI in sync
    if (state.playerLat && state.playerLng) {
      START_LATLNG = leaflet.latLng(state.playerLat, state.playerLng);
      initializeMap(START_LATLNG);
      createOriginMarker(START_LATLNG);
      createPlayerMarker(START_LATLNG);
      updateReachRectangle();
    }
    if (state.cellValues) {
      const cellValues = state.cellValues as Record<
        string,
        { hasToken: boolean; value: number }
      >;
      Object.entries(cellValues).forEach(([key, { hasToken, value }]) => {
        cellMemory.set(key, { hasToken, value });
        if (hasToken) {
          const [i, j] = key.split(",").map(Number);
          const token = createTokenAt(i, j);
          if (token) renderTokens.set(key, token);
        }
      });
    }
  }
}

//Buttons code
const North = document.getElementById("north");
const South = document.getElementById("south");
const East = document.getElementById("east");
const West = document.getElementById("west");
const NewGame = document.getElementById("newGame");

NewGame!.addEventListener("click", newGameFunction);
function newGameFunction() {
  const confirmed = confirm("Start a new game? Your progress will be lost!");
  if (confirmed) startNewGame();
}

function startNewGame() {
  // Stop current geolocation tracking if active
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  // Clear stored state
  localStorage.removeItem("d3-game-state");
  heldToken = null;
  PLAYER_LATLNG = null;
  START_LATLNG = null;

  // Reset tracking vars
  prevCenterI = null;
  prevCenterJ = null;

  // Clear maps
  cellMemory.clear();
  renderTokens.forEach((token) => {
    token.rect.remove();
    token.marker.remove();
  });
  renderTokens.clear();

  // Remove UI elements that may persist
  if (reachRect) {
    reachRect.remove();
    reachRect = null;
  }

  // Update UI
  updateInventory();

  // Restart geolocation
  startGeolocationTracking();
}

North!.addEventListener("click", northFunction);
function northFunction() {
  if (PLAYER_LATLNG === null) return;
  updatePlayer(PLAYER_LATLNG.lat + CELL_SIZE, PLAYER_LATLNG.lng);
}

South!.addEventListener("click", southFunction);
function southFunction() {
  if (PLAYER_LATLNG === null) return;
  updatePlayer(PLAYER_LATLNG.lat - CELL_SIZE, PLAYER_LATLNG.lng);
}

East!.addEventListener("click", eastFunction);
function eastFunction() {
  if (PLAYER_LATLNG === null) return;
  updatePlayer(PLAYER_LATLNG.lat, PLAYER_LATLNG.lng + CELL_SIZE);
}

West!.addEventListener("click", westFunction);
function westFunction() {
  if (PLAYER_LATLNG === null) return;
  updatePlayer(PLAYER_LATLNG.lat, PLAYER_LATLNG.lng - CELL_SIZE);
}

function updatePlayer(lat: number, lng: number) {
  if (PLAYER_LATLNG === null) return;
  PLAYER_LATLNG = leaflet.latLng(lat, lng);
  playerMarker.setLatLng(PLAYER_LATLNG);
  map.setView(PLAYER_LATLNG); // make map follow player

  removeTokens(
    lat,
    lng,
  );
  addTokens(PLAYER_LATLNG.lat, PLAYER_LATLNG.lng);
  updateReachRectangle();
}
