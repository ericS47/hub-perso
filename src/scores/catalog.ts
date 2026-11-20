// Jeux proposés au départ dans la feuille de route (modifiables ensuite).
// rule : « high » = le plus de points gagne, « low » = le moins de points gagne.
// target : la partie s'arrête quand un joueur atteint ce total
// (high : il gagne ; low : celui qui a le moins gagne alors).

export type ScoreCategory = 'societe' | 'cartes' | 'exterieur'
export type ScoreRule = 'high' | 'low'

export const SCORE_CATEGORIES: { id: ScoreCategory; label: string; icon: string }[] = [
  { id: 'societe', label: 'Société', icon: '🎲' },
  { id: 'cartes', label: 'Cartes', icon: '🃏' },
  { id: 'exterieur', label: 'Extérieur', icon: '🌳' },
]

export interface CatalogGame {
  slug: string
  name: string
  category: ScoreCategory
  icon: string
  rule: ScoreRule
  target?: number
}

type Row = [slug: string, name: string, icon: string, rule: ScoreRule, target?: number]

const SOCIETE: Row[] = [
  ['yams', 'Yams', '🎲', 'high'],
  ['scrabble', 'Scrabble', '🔤', 'high'],
  ['mille-bornes', 'Mille Bornes', '🚗', 'high', 5000],
  ['aventuriers-du-rail', 'Les Aventuriers du Rail', '🚂', 'high'],
  ['7-wonders', '7 Wonders', '🏛️', 'high'],
  ['7-wonders-duel', '7 Wonders Duel', '🏛️', 'high'],
  ['catan', 'Catan', '🏝️', 'high', 10],
  ['carcassonne', 'Carcassonne', '🏰', 'high'],
  ['splendor', 'Splendor', '💎', 'high', 15],
  ['azul', 'Azul', '🟦', 'high'],
  ['kingdomino', 'Kingdomino', '👑', 'high'],
  ['dixit', 'Dixit', '🎨', 'high', 30],
  ['wingspan', 'Wingspan', '🐦', 'high'],
  ['terraforming-mars', 'Terraforming Mars', '🪐', 'high'],
  ['ark-nova', 'Ark Nova', '🦁', 'high'],
  ['agricola', 'Agricola', '🌾', 'high'],
  ['akropolis', 'Akropolis', '🏛️', 'high'],
  ['cascadia', 'Cascadia', '🦊', 'high'],
  ['living-forest', 'Living Forest', '🌲', 'high'],
  ['faraway', 'Faraway', '🌄', 'high'],
  ['chateau-combo', 'Château Combo', '🏯', 'high'],
  ['takenoko', 'Takenoko', '🐼', 'high'],
  ['small-world', 'Small World', '🗺️', 'high'],
  ['puerto-rico', 'Puerto Rico', '⛵', 'high'],
  ['dice-forge', 'Dice Forge', '⚒️', 'high'],
  ['king-of-tokyo', 'King of Tokyo', '🦖', 'high', 20],
  ['patchwork', 'Patchwork', '🧵', 'high'],
  ['qwirkle', 'Qwirkle', '🔷', 'high'],
  ['rummikub', 'Rummikub', '🔢', 'high'],
  ['triominos', 'Triominos', '🔺', 'high'],
  ['dominos', 'Dominos', '🁫', 'low'],
  ['blokus', 'Blokus', '🟩', 'low'],
  ['boggle', 'Boggle', '🔠', 'high'],
  ['petit-bac', 'Petit Bac', '✏️', 'high'],
  ['trivial-pursuit', 'Trivial Pursuit', '🧀', 'high', 6],
  ['pictionary', 'Pictionary', '🖍️', 'high'],
  ['times-up', "Time's Up", '⏳', 'high'],
  ['codenames', 'Codenames', '🕵️', 'high'],
  ['monopoly', 'Monopoly', '🎩', 'high'],
  ['cluedo', 'Cluedo', '🔍', 'high'],
  ['cartographers', 'Cartographers', '🗺️', 'high'],
  ['hanabi', 'Hanabi', '🎆', 'high'],
  ['jaipur', 'Jaipur', '🐪', 'high'],
  ['splendor-duel', 'Splendor Duel', '💎', 'high'],
  ['sky-team', 'Sky Team', '✈️', 'high'],
  ['tokaido', 'Tokaido', '🗾', 'high'],
  ['five-tribes', 'Five Tribes', '🧞', 'high'],
  ['castles-of-burgundy', 'Les Châteaux de Bourgogne', '🏰', 'high'],
  ['qwixx', 'Qwixx', '🎲', 'high'],
  ['loups-garous', 'Loups-Garous', '🐺', 'high'],
  ['perudo', 'Perudo', '🎲', 'high'],
  ['echecs', 'Échecs', '♟️', 'high'],
  ['dames', 'Dames', '⚫', 'high'],
  ['backgammon', 'Backgammon', '🎯', 'high'],
  ['puissance-4', 'Puissance 4', '🔴', 'high'],
]

const CARTES: Row[] = [
  ['tarot', 'Tarot', '🃏', 'high'],
  ['belote', 'Belote', '♥️', 'high', 1000],
  ['coinche', 'Coinche', '♠️', 'high', 2000],
  ['rami', 'Rami', '🃏', 'low'],
  ['uno', 'Uno', '🟥', 'high', 500],
  ['skyjo', 'Skyjo', '🌈', 'low', 100],
  ['6-qui-prend', '6 qui prend !', '🐮', 'low', 66],
  ['dutch', 'Dutch (Cactus)', '🌵', 'low'],
  ['barbu', 'Barbu', '🧔', 'low'],
  ['huit-americain', 'Huit américain', '8️⃣', 'low'],
  ['dame-de-pique', 'Dame de pique', '♠️', 'low', 100],
  ['yaniv', 'Yaniv', '✋', 'low', 200],
  ['golf-cartes', 'Golf (cartes)', '⛳', 'low'],
  ['papayoo', 'Papayoo', '🍈', 'low'],
  ['whist', 'Whist', '♣️', 'high'],
  ['bridge', 'Bridge', '🌉', 'high'],
  ['canasta', 'Canasta', '🃏', 'high', 5000],
  ['gin-rummy', 'Gin Rummy', '🍸', 'high', 100],
  ['manille', 'Manille', '♦️', 'high'],
  ['president', 'Président', '🎩', 'high'],
  ['flip-7', 'Flip 7', '7️⃣', 'high', 200],
  ['skull-king', 'Skull King', '🏴‍☠️', 'high'],
  ['wizard', 'Wizard', '🧙', 'high'],
  ['sushi-go', 'Sushi Go!', '🍣', 'high'],
  ['love-letter', 'Love Letter', '💌', 'high', 4],
  ['lost-cities', 'Lost Cities', '🧭', 'high'],
  ['dobble', 'Dobble', '👀', 'high'],
  ['jungle-speed', 'Jungle Speed', '🌴', 'low'],
  ['sea-salt-paper', 'Sea Salt & Paper', '🐚', 'high', 40],
  ['odin', 'Odin', '🛡️', 'low', 15],
  ['the-game', 'The Game', '🔥', 'low'],
  ['crack-list', 'Crack List', '📝', 'high'],
  ['kems', 'Kems', '🤫', 'high'],
  ['pouilleux', 'Pouilleux', '🃏', 'low'],
  ['poker', 'Poker', '♣️', 'high'],
  ['bataille-corse', 'Bataille corse', '✋', 'high'],
]

const EXTERIEUR: Row[] = [
  ['petanque', 'Pétanque', '⚪', 'high', 13],
  ['molkky', 'Mölkky', '🪵', 'high', 50],
  ['palet-breton', 'Palet breton', '🥏', 'high', 12],
  ['boules-lyonnaises', 'Boules lyonnaises', '⚫', 'high', 13],
  ['flechettes-301', 'Fléchettes 301', '🎯', 'high', 301],
  ['flechettes-501', 'Fléchettes 501', '🎯', 'high', 501],
  ['mini-golf', 'Mini-golf', '⛳', 'low'],
  ['golf', 'Golf', '🏌️', 'low'],
  ['bowling', 'Bowling', '🎳', 'high'],
  ['cornhole', 'Cornhole', '🌽', 'high', 21],
  ['kubb', 'Kubb', '👑', 'high'],
  ['croquet', 'Croquet', '🔨', 'high'],
  ['badminton', 'Badminton', '🏸', 'high', 21],
  ['ping-pong', 'Ping-pong', '🏓', 'high', 11],
  ['volley', 'Volley-ball', '🏐', 'high', 25],
  ['beach-volley', 'Beach-volley', '🏐', 'high', 21],
  ['spikeball', 'Spikeball', '🟡', 'high', 21],
  ['ultimate', 'Ultimate frisbee', '🥏', 'high', 15],
  ['basket', 'Basket', '🏀', 'high'],
  ['football', 'Football', '⚽', 'high'],
  ['tennis', 'Tennis (jeux)', '🎾', 'high'],
  ['billard', 'Billard', '🎱', 'high'],
  ['baby-foot', 'Baby-foot', '⚽', 'high', 10],
  ['palets-planche', 'Palets sur planche', '🪙', 'high', 12],
  ['course', 'Course / relais', '🏃', 'low'],
  ['chasse-au-tresor', 'Chasse au trésor', '🗺️', 'high'],
  ['quilles', 'Jeu de quilles', '🎳', 'high'],
  ['tir-a-l-arc', "Tir à l'arc", '🏹', 'high'],
]

const build = (rows: Row[], category: ScoreCategory): CatalogGame[] =>
  rows.map(([slug, name, icon, rule, target]) => ({ slug, name, category, icon, rule, target }))

export const CATALOG: CatalogGame[] = [
  ...build(SOCIETE, 'societe'),
  ...build(CARTES, 'cartes'),
  ...build(EXTERIEUR, 'exterieur'),
]

export function ruleLabel(rule: ScoreRule, target?: number) {
  if (rule === 'high') return target ? `Premier à ${target} points` : 'Le plus de points gagne'
  return target ? `Fin à ${target} points · le moins gagne` : 'Le moins de points gagne'
}
