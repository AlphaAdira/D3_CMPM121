# D3: {game title goes here}

# Game Design Vision

The player gets dropped into an adventure game. They need to collect [tokens] from around the map to feul [energy pockets] around their base area. (crafting will be add tokens to the pocket to upgrade the pocket. pocket cannot move. potential other crafting thing: combining tokens so player can carry more. maybe they can carry as many full energy pockets they have.)

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
- [ ] Unload any grid spaces when leave area
- [ ] (Re)load new grid spaces when enter area
- [ ] Interactable cells move with player
- [ ] Edit crafting (one item that cant be crafted with until later)
- [ ] Edit craftable items (no longer rectangles with numbers)
- [ ] Edit spawn frequencies of tokens
