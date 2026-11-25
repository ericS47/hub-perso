import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CompanionSettings } from '../../../db'
import { getSetting, setSetting } from '../../../lib/settings'
import Avatar from '../Avatar'
import { markSeen } from '../sujets'
import CompanionPicker from '../CompanionPicker'
import { makeT } from '../voice'

const STEPS = 4

// Premier lancement : présentation, prénom, choix du compagnon, puis le compagnon se présente.
export default function Welcome() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  // Prénom déjà connu : on ne le redemande pas.
  const [knownName, setKnownName] = useState(false)
  const [companion, setCompanion] = useState<CompanionSettings>()

  useEffect(() => {
    void Promise.all([getSetting('companion'), getSetting('firstName')]).then(([c, f]) => {
      setCompanion(c)
      setFirstName(f)
      setKnownName(f.trim() !== '')
    })
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  if (!companion) return null
  const t = makeT(companion.tutoiement)
  const name = companion.name.trim() || 'ton compagnon'
  const prenom = firstName.trim()

  async function finish(to: string) {
    if (!companion) return
    await setSetting('companion', { ...companion, name: companion.name.trim() || 'Bondi' })
    await setSetting('firstName', firstName.trim())
    await setSetting('welcomeDone', true)
    // Juste après la présentation, pas besoin de la fenêtre « De quoi veux-tu parler ? ».
    markSeen()
    navigate(to, { replace: true })
  }

  return (
    <div className="compagnon-welcome">
      <div className="compagnon-steps" aria-label={`Étape ${step + 1} sur ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 0 && (
        <section className="stack">
          <div className="compagnon-center">
            <Avatar companion={{ ...companion, kind: 'bulle' }} size={110} mood="content" />
          </div>
          <h1>Bienvenue 👋</h1>
          <p>
            Cette application t’accompagne entre deux rendez-vous : organiser tes séances d’activité physique, noter comment
            tu te sens, et avoir un compagnon à qui en parler quand une séance saute, quand tu grignotes ou quand le moral flanche.
          </p>
          <div className="card">
            <h2>Ce qu’elle n’est pas</h2>
            <ul className="compagnon-list">
              <li>
                <strong>Pas un soignant.</strong> Ton compagnon est une application qui suit des dialogues écrits à l’avance. Il ne
                pose pas de diagnostic et ne remplace pas ton équipe.
              </li>
              <li>
                <strong>Pas un service d’urgence.</strong> En cas de détresse : <a href="tel:3114">3114</a> (prévention du suicide,
                24 h/24), <a href="tel:15">15</a> ou <a href="tel:112">112</a>.
              </li>
              <li>
                <strong>Tes données restent sur ton téléphone.</strong> Rien n’est envoyé sur internet.
              </li>
            </ul>
          </div>
          <button type="button" className="btn btn-block" onClick={() => setStep(knownName ? 2 : 1)}>
            C’est compris, on commence
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="stack">
          <h1>Comment aimerais-tu qu’on t’appelle ?</h1>
          <p className="muted">Ton prénom ou un surnom. Tu peux aussi laisser vide.</p>
          <label className="field">
            <span>Prénom ou surnom</span>
            <input value={firstName} maxLength={30} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" autoFocus />
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
              ← Retour
            </button>
            <button type="button" className="btn" onClick={() => setStep(2)}>
              Continuer
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1>Choisis ton compagnon</h1>
          <p className="muted">Celui avec qui tu auras envie de parler. Tu pourras tout changer plus tard.</p>
          <div className="compagnon-center compagnon-preview">
            <Avatar companion={companion} size={120} mood="content" />
            <strong>{name}</strong>
          </div>
          <CompanionPicker value={companion} onChange={setCompanion} />
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(knownName ? 0 : 1)}>
              ← Retour
            </button>
            <button type="button" className="btn" disabled={!companion.name.trim()} onClick={() => setStep(3)}>
              Continuer
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="stack">
          <div className="compagnon-center">
            <Avatar companion={companion} size={120} mood="encourageant" />
          </div>
          <div className="compagnon-thread">
            <p className="compagnon-bubble them">
              {t(`Bonjour${prenom ? ` ${prenom}` : ''} ! Moi, c’est ${name}.`, `Bonjour${prenom ? ` ${prenom}` : ''} ! Moi, c’est ${name}.`)}
            </p>
            <p className="compagnon-bubble them">
              {t(
                'Je suis là pour t’écouter : quand une séance saute, quand tu grignotes, quand le moral flanche… ou juste quand tu as envie d’écrire.',
                'Je suis là pour vous écouter : quand une séance saute, quand vous grignotez, quand le moral flanche… ou juste quand vous avez envie d’écrire.',
              )}
            </p>
            <p className="compagnon-bubble them">
              {t(
                'Je ne suis qu’une application, pas une personne ni un soignant. Mais je peux t’aider à y voir plus clair, et te dire quand ce serait bien d’en parler à ton équipe.',
                'Je ne suis qu’une application, pas une personne ni un soignant. Mais je peux vous aider à y voir plus clair, et vous dire quand ce serait bien d’en parler à votre équipe.',
              )}
            </p>
            <p className="compagnon-bubble them">
              {t(
                'Pour commencer, tu veux remplir ton profil ? Ça aide à organiser des séances qui te ressemblent.',
                'Pour commencer, vous voulez remplir votre profil ? Ça aide à organiser des séances qui vous ressemblent.',
              )}
            </p>
          </div>
          <button type="button" className="btn btn-block" onClick={() => void finish('/profil')}>
            Commencer mon profil
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => void finish('/')}>
            Plus tard, aller à l’accueil
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep(2)}>
            ← Changer de compagnon
          </button>
        </section>
      )}
    </div>
  )
}
