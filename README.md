# Hub perso

Application web progressive (PWA) qui regroupe au même endroit : culture, finance, info, emploi et promos, avec la météo, l'agenda et une liste de tâches sur l'accueil.

Les données (tâches, bibliothèque culture, portefeuilles virtuels) restent sur l'appareil, dans le navigateur (IndexedDB). Rien n'est envoyé à un serveur.

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
- Culture, propositions pendant la saisie du titre et couvertures (sans clé) : iTunes (films, séries), Google Livres et Open Library (livres), Wikipédia (jeux, spectacles). Les photos importées restent dans l'appareil.
