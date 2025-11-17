# D3: {game title goes here}

# Game Design Vision

The player gets dropped into an adventure game. They need to collect [tokens] from around the map to fuel [energy pocket[s]] around their base area (origin). (crafting will be add tokens to the pocket to upgrade the pocket. pocket cannot move. potential other crafting thing: combining tokens so player can carry more. maybe they can carry as many full energy pockets they have. Or the only energy pocket that levels up with more tokens)

# Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

# Assignments

## D3.a: Core mechanics

### Steps

- [x] Set up Leaflet map
- [x] Draw grid of cells
- [x] Add inventory display
- [x] Show tokens on cells
- [x] Make cells clickable
- [x] Pick up range
- [x] Implement pickup & crafting
- [x] Add win condition

## D3.b: Globe-spanning Gameplay

### Steps

- [x] Make working movement buttons
- [x] Track player movement
- [x] Recenter loaded grid to player
- [x] Update reach logic to 3 cells of **player** (not origin)

---

- [x] Edit crafting (items can't craft with EVERYTHING)

## D3.c: Object persistence

### Steps

- [x] Make cells retain state when manually reloaded. (Focus #1)
- [x] Hook into scroll/pan events to "save" cells going offscreen. (Focus #2)
- [x] Restore state when cells return (already did that in D3.b, just didnt notice)
- [x] Profile memory — ensure unmodified cells aren’t stored. (did while doing the other two)

## D3.d: Gameplay Across Real-world Space and Time

### Steps

- [x] use geolocation API to track player location
- [x] encapsulate the Geolocation API behind a simple interface (Facade design pattern)
- [ ] localStorage API should be used to persist game state across page loads
- [ ] implement a way to start a new game
- [ ] toggle button-based vs geolocation-based movement

---

### Steps to get closer to Design Vision

- [ ] Edit craftable items (no longer rectangles with numbers)
- [ ] Edit spawn frequencies of tokens
- [ ] customize map to fit design vision
- [ ] add home-base feature that gets placed where player starts
- [ ] change win condition to match design vision (bring enough loot back to base)
- [ ] add storage/strength to player carry limit (ex: weak player can't pickup token worth 4 points)
