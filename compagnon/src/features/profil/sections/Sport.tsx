import { Choice, SubBlock, TextField, YesNo } from '../fields'
import { newId, useSectionEditor } from '../store'
import type { ClubSport, CurrentActivity, Regularity, Since } from '../types'
import Wizard, { type Step } from '../Wizard'

const SINCE: { value: Since; label: string }[] = [
  { value: 'moins3mois', label: 'Moins de 3 mois' },
  { value: '3a12mois', label: '3 à 12 mois' },
  { value: '1a3ans', label: '1 à 3 ans' },
  { value: 'plus3ans', label: 'Plus de 3 ans' },
]

const REGULARITY: { value: Regularity; label: string }[] = [
  { value: 'rarement', label: 'De temps en temps' },
  { value: 'mois', label: 'Quelques fois par mois' },
  { value: 'semaine1', label: '1 fois par semaine' },
  { value: 'semaine2-3', label: '2 à 3 fois par semaine' },
  { value: 'semaine4', label: '4 fois ou plus par semaine' },
  { value: 'variable', label: 'Ça dépend des périodes' },
]

export default function Sport() {
  const ed = useSectionEditor('sport')
  if (!ed) return null
  const { data: d, update } = ed
  const clubs = d.clubSports ?? []
  const current = d.current ?? []

  const setClub = (id: string, patch: Partial<ClubSport>) =>
    update((p) => ({ ...p, clubSports: (p.clubSports ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  const setCurrent = (id: string, patch: Partial<CurrentActivity>) =>
    update((p) => ({ ...p, current: (p.current ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) }))

  const steps: Step[] = [
    {
      key: 'ecole',
      title: 'À l’école',
      content: (
        <>
          <YesNo label="As-tu apprécié le sport (l’EPS) à l’école ?" value={d.schoolLiked} onChange={(schoolLiked) => update({ schoolLiked })} />
          {d.schoolLiked !== undefined && (
            <SubBlock>
              <TextField
                label="Pourquoi ?"
                multiline
                value={d.schoolWhy}
                onChange={(schoolWhy) => update({ schoolWhy })}
                placeholder={d.schoolLiked ? 'Les copains, le jeu, un prof…' : 'Le regard des autres, les notes…'}
              />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'club',
      title: 'En club',
      content: (
        <>
          <YesNo label="As-tu fait du sport en club ?" value={d.club} onChange={(club) => update((p) => ({ ...p, club, clubSports: club && !p.clubSports?.length ? [{ id: newId(), sport: '' }] : p.clubSports }))} />
          {d.club && (
            <SubBlock>
              {clubs.map((c, n) => (
                <div key={c.id} className="profil-item">
                  <div className="row-between">
                    <strong>Sport n° {n + 1}</strong>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Retirer ${c.sport || `le sport n° ${n + 1}`}`}
                      onClick={() => update((p) => ({ ...p, clubSports: (p.clubSports ?? []).filter((x) => x.id !== c.id) }))}
                    >
                      ✕
                    </button>
                  </div>
                  <TextField label="Quel sport ?" value={c.sport} onChange={(sport) => setClub(c.id, { sport })} placeholder="Football, danse, judo…" />
                  <div className="profil-two">
                    <TextField label="De (année)" value={c.from} onChange={(from) => setClub(c.id, { from })} placeholder="1998" />
                    <TextField label="À (année)" value={c.to} onChange={(to) => setClub(c.id, { to })} placeholder="2004" />
                  </div>
                  <TextField label="Pourquoi as-tu arrêté ?" value={c.stopReason} onChange={(stopReason) => setClub(c.id, { stopReason })} placeholder="Déménagement, blessure, travail…" />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => update((p) => ({ ...p, clubSports: [...(p.clubSports ?? []), { id: newId(), sport: '' }] }))}
              >
                + Ajouter un sport
              </button>
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'autonomie',
      title: 'En autonomie',
      content: (
        <>
          <YesNo label="As-tu déjà pratiqué une activité seul·e, en dehors d’un club ?" value={d.autonomy} onChange={(autonomy) => update({ autonomy })} />
          {d.autonomy && (
            <SubBlock>
              <TextField label="Laquelle ou lesquelles ?" multiline value={d.autonomyWhat} onChange={(autonomyWhat) => update({ autonomyWhat })} placeholder="Marche, vélo, piscine, vidéos à la maison…" />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'aujourdhui',
      title: 'Aujourd’hui',
      content: (
        <>
          <YesNo label="Pratiques-tu une activité sportive en ce moment ?" value={d.sportyNow} onChange={(sportyNow) => update((p) => ({ ...p, sportyNow, current: sportyNow && !p.current?.length ? [{ id: newId(), what: '' }] : p.current }))} />
          {d.sportyNow && (
            <SubBlock>
              {current.map((c, n) => (
                <div key={c.id} className="profil-item">
                  <div className="row-between">
                    <strong>Activité n° {n + 1}</strong>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Retirer ${c.what || `l’activité n° ${n + 1}`}`}
                      onClick={() => update((p) => ({ ...p, current: (p.current ?? []).filter((x) => x.id !== c.id) }))}
                    >
                      ✕
                    </button>
                  </div>
                  <TextField label="Quoi ?" value={c.what} onChange={(what) => setCurrent(c.id, { what })} placeholder="Aquagym, marche nordique…" />
                  <Choice label="Depuis combien de temps ?" options={SINCE} value={c.since} onChange={(since) => setCurrent(c.id, { since })} />
                  <Choice label="À quelle fréquence ?" options={REGULARITY} value={c.regularity} onChange={(regularity) => setCurrent(c.id, { regularity })} />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => update((p) => ({ ...p, current: [...(p.current ?? []), { id: newId(), what: '' }] }))}
              >
                + Ajouter une activité
              </button>
            </SubBlock>
          )}
          {d.sportyNow === false && <p className="profil-answer">C’est noté. On construira ensemble, pas à pas, à ton rythme.</p>}
        </>
      ),
    },
  ]
  return <Wizard id="sport" steps={steps} onFinish={() => ed.setDone(true)} />
}
