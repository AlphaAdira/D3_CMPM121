# D3: {game title goes here}

# Game Design Vision

The player gets dropped into an adventure game. They need to collect [tokens] from around the map to feul [energy pockets] around their base area. (crafting will be add tokens to the pocket to upgrade the pocket. pocket cannot move. potential other crafting thing: combining tokens so player can carry more. maybe they can carry as many full energy pockets they have.)

# Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

# Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps

- [x] Set up Leaflet map
- [x] Draw grid of cells
- [x] Add inventory display
- [x] Show tokens on cells
- [x] Make cells clickable
- [x] Pick up range
- [ ] Implement pickup & crafting
- [x] Add win condition
