# kikkolino

kikkolino hip-hop és trap producer weboldala (angol nyelvű): filmszerű, görgetésre animált egyoldalas oldal (HTML + CSS + JavaScript, build lépés és külső könyvtár nélkül).

## Megnyitás

Nyisd meg az `index.html` fájlt böngészőben, vagy indíts egy helyi szervert:

```bash
python3 -m http.server 8000
```

## Részek

- **Hero:** éjszakai városkép, ami görgetésre a zenére mozgó spektrum-tájjá oldódik
- **About:** szekvenszer-rács, ami a kickre villan, majd felcsúszó fehér panel szavanként előtűnő szöveggel
- **Process:** izometrikus stúdiópult (padek, potméterek, faderek), „render → drótváz” törléssel, villogó REC jelzéssel
- **K S 8 → Kick Snare 808** betűanimáció
- **Services:** vízszintesen gördülő kártyák felcsúszó hangfal-ajtókkal; a hangszórók a kickre pumpálnak
- **Snippets:** két 30 másodperces snippet hullámformás lejátszóval, forgó bakelit és a zenére reagáló spektrum
- **Booking:** űrlap, ami kitöltve megnyitja a levelezőt az előre megírt üzenettel

## Snippetek

Az `audio/` mappában:

- `untitled-01.mp3` – az első felvétel 13–43. másodperce (a dropot is tartalmazza)
- `opiumshi3.mp3` – a második felvétel 11–41. másodperce
- `snippets-data.js` – előre kiszámolt hangszínkép és kick-burkoló (30 fps). Ebből mozognak a vizuálok, így `file://`-ról megnyitva is működik.

A lejátszás a „Play snippet” gombbal (hero, menüsáv) vagy a lejátszókártyákon indul; a hullámformára kattintva lehet tekerni.

## Testreszabás

- E-mail-cím: `index.html` → `booking@kikkolino.hu` (az űrlap is ide küld)
- Platformlinkek (Spotify, YouTube, SoundCloud, Instagram): `index.html`, a `#snippets` szekcióban a `href="#"` értékek
- Számcímek: `index.html` (track kártyák) és `script.js` → `tracks`
