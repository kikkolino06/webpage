# kikkolino

kikkolino hip-hop és trap producer weboldala: filmszerű, görgetésre animált egyoldalas oldal (HTML + CSS + JavaScript, build lépés és külső könyvtár nélkül).

## Megnyitás

Nyisd meg az `index.html` fájlt böngészőben, vagy indíts egy helyi szervert:

```bash
python3 -m http.server 8000
```

## Részek

- **Hero:** éjszakai városkép, ami görgetésre lüktető, drótvázas tájjá oldódik
- **Rólam:** 16 lépéses szekvenszer-rács, majd felcsúszó fehér panel szavanként előtűnő szöveggel
- **Folyamat:** izometrikus stúdiópult (padek, potméterek, faderek), „render → drótváz” törléssel
- **K S 8 → Kick Snare 808** betűanimáció
- **Szolgáltatások:** vízszintesen gördülő kártyák felcsúszó hangfalrács-ajtókkal
- **Zene:** forgó bakelit spektrummal és platformlinkekkel
- **Booking:** űrlap, ami kitöltve megnyitja a levelezőt az előre megírt üzenettel

## Beat

A „Beat indítása” gomb egy kódból generált (Web Audio), 140 BPM-es trap loopot játszik: 808, snare, hi-hat rollok és csengő dallam. A vizuális elemek a kickre lüktetnek.

## Testreszabás

- E-mail-cím: `index.html` → `booking@kikkolino.hu` (az űrlap is ide küld)
- Platformlinkek (Spotify, YouTube, SoundCloud, Instagram): `index.html`, a `#zene` szekcióban a `href="#"` értékek
- Beat mintázat és tempó: `script.js` → `BPM` és `pattern`
