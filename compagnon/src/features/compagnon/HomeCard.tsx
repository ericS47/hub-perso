import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { addDays, isoDate } from '../../lib/dates'
import { useSetting } from '../../lib/settings'
import { companionT, dayMoment, type T } from './voice'
import './compagnon.css'

function phrases(t: T, ctx: { moment: ReturnType<typeof dayMoment>; done: number; moodToday?: number }): string[] {
  const { moment, done, moodToday } = ctx
  // Valorisation des séances faites récemment : prioritaire.
  if (done > 0) {
    return [
      t(
        `${done} séance${done > 1 ? 's' : ''} faite${done > 1 ? 's' : ''} ces 7 derniers jours. Bravo, chacune compte vraiment.`,
        `${done} séance${done > 1 ? 's' : ''} faite${done > 1 ? 's' : ''} ces 7 derniers jours. Bravo, chacune compte vraiment.`,
      ),
      t(
        `Tu as bougé ${done} fois ces 7 derniers jours. Ça fait plaisir à voir, continue à ton rythme !`,
        `Vous avez bougé ${done} fois ces 7 derniers jours. Ça fait plaisir à voir, continuez à votre rythme !`,
      ),
    ]
  }
  if (moodToday !== undefined && moodToday <= 4) {
    return [
      t('Ta météo du jour est un peu grise. Si tu veux en parler, je suis là.', 'Votre météo du jour est un peu grise. Si vous voulez en parler, je suis là.'),
      t('Journée plus difficile aujourd’hui. Pas besoin d’en faire beaucoup : prends soin de toi.', 'Journée plus difficile aujourd’hui. Pas besoin d’en faire beaucoup : prenez soin de vous.'),
    ]
  }
  if (moment === 'matin') {
    return [
      t('Une nouvelle journée commence. Qu’est-ce qui te ferait du bien aujourd’hui ?', 'Une nouvelle journée commence. Qu’est-ce qui vous ferait du bien aujourd’hui ?'),
      t('Bonne journée ! Un petit pas aujourd’hui, c’est déjà beaucoup.', 'Bonne journée ! Un petit pas aujourd’hui, c’est déjà beaucoup.'),
      t('Le matin, c’est un bon moment pour jeter un œil à tes séances de la semaine.', 'Le matin, c’est un bon moment pour jeter un œil à vos séances de la semaine.'),
    ]
  }
  if (moment === 'soir' || moment === 'nuit') {
    return [
      t('La journée touche à sa fin. Comment ça a été, pour toi ?', 'La journée touche à sa fin. Comment ça a été, pour vous ?'),
      t('Ce soir, pense à une chose qui s’est bien passée aujourd’hui, même toute petite.', 'Ce soir, pensez à une chose qui s’est bien passée aujourd’hui, même toute petite.'),
      t('Si quelque chose te pèse ce soir, tu peux venir me le dire.', 'Si quelque chose vous pèse ce soir, vous pouvez venir me le dire.'),
    ]
  }
  return [
    t('Je suis là si tu as besoin de parler, d’une séance qui a sauté ou d’un coup de mou.', 'Je suis là si vous avez besoin de parler, d’une séance qui a sauté ou d’un coup de mou.'),
    t('Chaque petit pas compte, même ceux qu’on ne voit pas.', 'Chaque petit pas compte, même ceux qu’on ne voit pas.'),
    t('Tu avances à ton rythme, et c’est le bon.', 'Vous avancez à votre rythme, et c’est le bon.'),
  ]
}

// Carte de l'accueil : une phrase du compagnon adaptée au moment et à la semaine.
export default function HomeCard() {
  const companion = useSetting('companion')
  const [seed] = useState(() => Math.random())
  const today = isoDate()
  const data = useLiveQuery(async () => {
    const [mood, sessions] = await Promise.all([
      db.moods.where('date').equals(today).first(),
      db.sessions.where('date').between(addDays(today, -6), today, true, true).toArray(),
    ])
    return { mood, done: sessions.filter((s) => s.status === 'faite').length }
  }, [today])

  if (!companion || !data) return null
  const t = companionT(companion)
  const list = phrases(t, { moment: dayMoment(), done: data.done, moodToday: data.mood?.moral })
  const phrase = list[Math.floor(seed * list.length)]

  return (
    <section className="card compagnon-home" aria-label={`Message de ${companion.name}`}>
      <p className="compagnon-bubble them">{phrase}</p>
      <div className="btn-row">
        <Link to="/compagnon" className="btn">
          💬 Parler
        </Link>
        {!data.mood && (
          <Link to="/compagnon/meteo" className="btn btn-secondary">
            🌤️ Ma météo du jour
          </Link>
        )}
      </div>
    </section>
  )
}
