# Aranykapu Zenekar Webshop – új megjelenés

Az [aranykapuwebshop.hu](https://aranykapuwebshop.hu/) újratervezett, statikus változata. A tartalom (termékek, árak, szövegek,
képek, ÁSZF, adatvédelem) az eredeti oldalról származik, a színvilág (rózsaszín `#f9a9f5`, fehér, fekete csíkok) megmaradt.

## Oldalak

| Fájl | Tartalom |
| --- | --- |
| `index.html` | Főoldal |
| `termekek.html` | Webshop, kategóriaszűrővel (`?kategoria=konyv`, `cd`, `ajandek`, `belepojegy`) |
| `termek.html?t=<slug>` | Termékoldal |
| `rolunk.html` | Rólunk |
| `aszf.html`, `adatvedelmi-nyilatkozat.html` | Jogi oldalak |

## Termékek frissítése

Az összes termék az `assets/js/products.js` fájlban van (név, ár, készlet, kategória, képek, leírás).

## Kosár és fizetés

A „Kosárba” gombok az eredeti WooCommerce webshop kosarába teszik a terméket
(`https://aranykapuwebshop.hu/kosar/?add-to-cart=<id>`), így a rendelés, a szállítás és a fizetés továbbra is ott történik.

## Helyi futtatás

```sh
python3 -m http.server 8000
# majd: http://localhost:8000
```
