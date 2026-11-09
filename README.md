# Hub perso

Application web progressive (PWA) qui regroupe au même endroit : culture, finance, info, notes, emploi et promos, avec la météo, l'agenda et une liste de tâches sur l'accueil.

Les notes se rangent par étiquettes et sous-étiquettes, et peuvent être dictées (reconnaissance vocale du navigateur). Seule exception au « tout local » : pendant une dictée, le navigateur peut envoyer l'audio à son service de reconnaissance (Google sur Chrome, Apple sur Safari).

Les données (tâches, bibliothèque culture, portefeuilles virtuels, notes) restent sur l'appareil, dans le navigateur (IndexedDB). Rien n'est envoyé à un serveur.

## Lancer en local

```bash
npm install
npm run dev
```

## Publier

Chaque envoi sur `main` construit l'app et la publie sur GitHub Pages (workflow `.github/workflows/deploy.yml`) :
https://erics47.github.io/hub-perso/

## Sources de données

- Météo : Open-Meteo (sans clé)
- Cours Bitcoin et Ethereum : CoinGecko (sans clé)
- Culture, propositions pendant la saisie du titre et couvertures (sans clé) : Wikidata et Wikipédia (tous les types), iTunes (films, séries), Google Livres et Open Library (livres). Les photos importées restent dans l'appareil.
