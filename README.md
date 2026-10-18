# webpage

Egyoldalas, reszponzív bemutatkozó weboldal (HTML + CSS + JavaScript, build lépés nélkül).

## Megnyitás

Nyisd meg az `index.html` fájlt böngészőben, vagy indíts egy helyi szervert:

```bash
python3 -m http.server 8000
```

## Funkciók

Filmszerű, görgetésre animált oldal (külső könyvtár nélkül, saját görgetésvezérlővel):

- Lebegő, átlátszó navigáció, amely a szekció színéhez igazodik
- Hero: naplemente, amely görgetésre drótvázas tájjá oldódik, betűnként előtűnő címekkel
- Sötét, villódzó rács, majd felcsúszó fehér panel szavanként megjelenő szöveggel
- Folyamat: izometrikus blokkok, „fotó → drótváz” törléses átmenettel
- Betűszó-animáció: M W S → Modern Web Stúdió
- Vízszintesen görgethető szolgáltatás-kártyák felnyíló ajtókkal
- Forgó földgömb lime ívekkel és számlálókkal
- Kapcsolati űrlap kliensoldali ellenőrzéssel
- Mobilra optimalizálva, `prefers-reduced-motion` támogatással
