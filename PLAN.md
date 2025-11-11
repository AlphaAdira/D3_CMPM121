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

- [ ] Make working movement buttons
- [ ] Track player movement
- [ ] Recenter loaded grid to player
- [ ] Update reach logic to 3 cells of **player** (not origin)

---

- [x] Edit crafting (items can't craft with EVERYTHING)
- [ ] Edit craftable items (no longer rectangles with numbers)
- [ ] Edit spawn frequencies of tokens
