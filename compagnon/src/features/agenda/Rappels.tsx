import { useId, useState } from 'react'
import type { ReminderSettings } from '../../db'
import { DAY_NAMES, DAY_SHORT } from '../../lib/dates'
import { setSetting } from '../../lib/settings'
import PageShell from '../../ui/PageShell'
import { useCompanion, useReminders } from './hooks'
import { notificationsSupported, notify } from './reminderLogic'

const BEFORE = [10, 15, 30, 60, 120]

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <label className="agenda-toggle" htmlFor={id}>
      <span>
        <strong>{label}</strong>
        {hint && <span className="muted"> {hint}</span>}
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

export default function Rappels() {
  const r = useReminders()
  const { name, t } = useCompanion()
  const timeId = useId()
  const supported = notificationsSupported()
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(supported ? Notification.permission : 'unsupported')
  const [explain, setExplain] = useState(false)
  const [tested, setTested] = useState<string | null>(null)

  const save = (patch: Partial<ReminderSettings>) => setSetting('reminders', { ...r, ...patch })

  async function ask() {
    setExplain(false)
    try {
      const p = await Notification.requestPermission()
      setPerm(p)
      if (p === 'granted') await save({ enabled: true })
    } catch {
      setPerm(Notification.permission)
    }
  }

  async function test() {
    const ok = await notify(`Coucou, c'est ${name} 👋`, t('Les rappels fonctionnent. À bientôt pour ta prochaine séance !', 'Les rappels fonctionnent. À bientôt pour votre prochaine séance !'), 'agenda-test', '/agenda/rappels')
    setTested(ok ? 'Notification envoyée. Si rien ne s’affiche, vérifie les réglages de notifications du téléphone.' : 'Impossible d’envoyer une notification sur cet appareil.')
  }

  return (
    <PageShell title="Mes rappels" subtitle="Être prévenu·e, en douceur" backTo="/agenda">
      <p className="demo-note">
        Les rappels fonctionnent quand l'appli est ouverte ou vient d'être utilisée ; les vrais SMS d'encouragement arriveront avec une formule future.
      </p>

      <section className="card">
        <h2>Notifications</h2>
        {perm === 'unsupported' && (
          <p className="muted">
            Ce navigateur ne sait pas afficher de notifications. Sur iPhone, ajoute d'abord l'appli à l'écran d'accueil (bouton Partager, puis « Sur l'écran d'accueil »). Les rappels resteront visibles dans l'appli, et le bouton « Ajouter à mon agenda » de chaque séance te donne un vrai rappel du téléphone.
          </p>
        )}
        {perm === 'denied' && (
          <p className="muted">
            Les notifications sont bloquées pour cette appli. Pour les autoriser, passe par les réglages du navigateur ou du téléphone. En attendant, les rappels s'affichent dans l'appli.
          </p>
        )}
        {perm === 'default' && !explain && (
          <>
            <p>Je peux te prévenir avant tes séances et te rappeler de préparer ta semaine.</p>
            <button type="button" className="btn btn-block" onClick={() => setExplain(true)}>
              🔔 Activer les notifications
            </button>
          </>
        )}
        {perm === 'default' && explain && (
          <div className="card card-soft agenda-explain">
            <p>
              <strong>Ton téléphone va te demander une autorisation.</strong> Réponds « Autoriser » pour recevoir mes petits rappels. Ils restent sur ton téléphone : rien n'est envoyé ailleurs. Tu pourras les couper à tout moment ici.
            </p>
            <div className="btn-row">
              <button type="button" className="btn" onClick={ask}>
                J'ai compris, continuer
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setExplain(false)}>
                Plus tard
              </button>
            </div>
          </div>
        )}
        {perm === 'granted' && (
          <>
            <Toggle label="Recevoir les notifications" checked={r.enabled} onChange={(v) => save({ enabled: v })} />
            {r.enabled && (
              <button type="button" className="btn btn-secondary btn-block" onClick={test}>
                Envoyer une notification d'essai
              </button>
            )}
            {tested && <p className="muted agenda-small" role="status">{tested}</p>}
          </>
        )}
      </section>

      <section className="card">
        <h2>Mon rendez-vous de la semaine</h2>
        <p className="muted">Le moment où je te rappelle de placer tes séances.</p>
        <fieldset className="chips">
          <legend>Quel jour ?</legend>
          <div className="agenda-weekday-row">
            {DAY_SHORT.map((d, i) => (
              <button
                key={d}
                type="button"
                aria-pressed={r.planningDay === i}
                aria-label={DAY_NAMES[i]}
                className={r.planningDay === i ? 'chip on' : 'chip'}
                onClick={() => save({ planningDay: i })}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field" htmlFor={timeId}>
          <span>À quelle heure ?</span>
          <input id={timeId} type="time" value={r.planningTime} onChange={(e) => e.target.value && save({ planningTime: e.target.value })} />
        </label>
        <p className="muted agenda-small">
          {r.planningDay >= 4 ? `Le ${DAY_NAMES[r.planningDay].toLowerCase()}, on prépare la semaine suivante.` : `Le ${DAY_NAMES[r.planningDay].toLowerCase()}, on prépare la semaine en cours.`}
        </p>
      </section>

      <section className="card">
        <h2>Avant chaque séance</h2>
        <fieldset className="chips">
          <legend>Me prévenir…</legend>
          <div className="chips-row">
            {BEFORE.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={r.beforeSessionMin === m}
                className={r.beforeSessionMin === m ? 'chip on' : 'chip'}
                onClick={() => save({ beforeSessionMin: m })}
              >
                {m < 60 ? `${m} min avant` : `${m / 60} h avant`}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card">
        <Toggle
          label="Messages d'encouragement"
          hint={t('Un petit mot le matin des jours de séance.', 'Un petit mot le matin des jours de séance.')}
          checked={r.encouragements}
          onChange={(v) => save({ encouragements: v })}
        />
      </section>
    </PageShell>
  )
}
