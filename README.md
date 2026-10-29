# Rink Report

An independent fan guide to the NHL: all 32 teams, how the season and playoffs work, Stanley Cup history, rules and awards. It also has Rink Draft, a fantasy hockey game where you snake-draft six players against three computer GMs and play a simulated season.

Live scores, standings and stats link out to NHL.com instead of being copied here.

This is a plain static site: HTML, CSS and vanilla JavaScript. There's no build step and no backend.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Home: league at a glance, links to live data, site sections |
| `teams.html` | All 32 teams by division, with city and arena |
| `league.html` | Season format, standings points, overtime, playoffs, draft, cap |
| `history.html` | Stanley Cup Finals since 2015, Original Six, most Cups |
| `rules.html` | Positions, basic rules, major awards |
| `fantasy.html` + `draft.js` | The Rink Draft fantasy game |
| `players.js` | Fantasy player pool and game ratings |
| `terms.html`, `privacy.html` | Terms & Conditions and Privacy Policy |
| `favicon.svg`, `styles.css` | Icon and styles |

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

Edit `players.js`. `off`/`def` (skaters) and `sv` (goalies) are 1-99 ratings that drive the simulation. They are game balancing numbers, not real stats. Update the team codes after trades.

## Disclaimer

Fan project, not affiliated with or endorsed by the NHL. Team, arena and history facts should be checked against NHL.com once a season, since arenas get renamed and new champions are crowned.
