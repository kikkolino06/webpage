# Rink Draft

A free fantasy hockey game built around NHL players. You pick three forwards, two defensemen and a goalie under a $50M cap. Then you play a 10-week simulated season against computer teams.

This is a plain static site: HTML, CSS and vanilla JavaScript. There's no build step and no backend.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Home page: how it works, scoring, roster rules, hockey basics |
| `play.html` + `game.js` | The fantasy game (draft, weekly simulation, season log) |
| `players.js` | Player pool, game prices and ratings |
| `terms.html`, `privacy.html` | Terms & Conditions and Privacy Policy |
| `favicon.svg` | Site icon |
| `styles.css` | All styles |

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Deploy with a custom domain (GitHub Pages)

1. In the repo, go to Settings > Pages and set the source to the `main` branch, root folder.
2. Buy a domain from any registrar.
3. Add a file named `CNAME` at the repo root that contains only your domain, for example `rinkdraft.com`.
4. At your registrar, point the domain at GitHub Pages. For an apex domain, add A records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. For `www`, add a CNAME record pointing to `<your-username>.github.io`.
5. Back in Settings > Pages, enter the domain and turn on "Enforce HTTPS".

## Updating players

Edit `players.js`. `price` is in game millions. `off`/`def` (skaters) and `sv` (goalies) are 1-99 ratings that drive the simulation. They are game balancing numbers, not real stats. Update the team codes after trades.

## Disclaimer

Fan project, not affiliated with or endorsed by the NHL.
