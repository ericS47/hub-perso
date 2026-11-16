import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { db, type JournalEntry, type JournalType } from '../../../db'
import { useSetting } from '../../../lib/settings'
import Chips from '../../../ui/Chips'
import Scale from '../../../ui/Scale'
import Sheet from '../../../ui/Sheet'
import Avatar from '../Avatar'
import Breathing from '../Breathing'
import { loadContext } from '../context'
import {
  answerText,
  EMOTIONS,
  emotionLabel,
  type Answer,
  type ConversationContext,
  type Exchange,
  type InputSpec,
  type ScriptId,
  type Turn,
  type TurnAction,
} from '../engine/types'
import { SAFETY_TURN } from '../engine/withSafety'
import { isScriptId, provider } from '../scripts'
import { companionT, makeT, type T } from '../voice'

type Item =
  | { from: 'compagnon'; text: string; safety?: boolean }
  | { from: 'moi'; text: string; skipped?: boolean }
  | { from: 'actions'; actions: TurnAction[]; safety?: boolean }

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms))
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Construit l'entrée de journal à partir des échanges (sans le message de sécurité ni les questions passées).
function buildEntry(script: ScriptId, exchanges: Exchange[], sessionId?: number): JournalEntry {
  const type: JournalType = script === 'bonne-nouvelle' ? 'libre' : script
  const real = exchanges.filter((e) => e.turnId !== SAFETY_TURN && !e.answer.skipped)
  const emotions: string[] = []
  let intensity: number | undefined
  for (const e of real) {
    if (e.input.kind === 'emotions') {
      for (const v of e.answer.values ?? []) emotions.push(emotionLabel(v))
      if (e.answer.text?.trim()) emotions.push(e.answer.text.trim())
    }
    if (e.input.kind === 'scale' && e.input.measure === 'intensity') intensity = e.answer.number
  }
  return {
    type,
    answers: real.map((e) => ({ question: e.question, answer: answerText(e.input, e.answer) })).filter((a) => a.answer),
    emotions: [...new Set(emotions)],
    intensity,
    sessionId,
    createdAt: Date.now(),
  }
}

// Une nouvelle conversation repart de zéro quand le sujet ou la séance change.
export default function TalkPage() {
  const { type } = useParams()
  const [params] = useSearchParams()
  return <Talk key={`${type}-${params.get('seance') ?? ''}`} />
}

function Talk() {
  const { type } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const companion = useSetting('companion')
  const t = companionT(companion)

  const sessionId = Number(params.get('seance')) || undefined
  const script: ScriptId | null = isScriptId(type) ? type : null

  const [ctx, setCtx] = useState<ConversationContext>()
  const [items, setItems] = useState<Item[]>([])
  const [typing, setTyping] = useState(false)
  const [turn, setTurn] = useState<Turn>()
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [savedId, setSavedId] = useState<number>()
  const [askStop, setAskStop] = useState(false)
  const [breathing, setBreathing] = useState(false)
  const alive = useRef(true)
  const endRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // Charge le contexte puis lance le premier tour.
  useEffect(() => {
    if (!script) return
    let cancel = false
    loadContext(script, sessionId).then((c) => {
      if (cancel) return
      setCtx(c)
      void play(c, [])
    })
    return () => {
      cancel = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, sessionId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'end' })
  }, [items, typing, turn])

  async function save(c: ConversationContext, ex: Exchange[]) {
    if (savingRef.current) return
    savingRef.current = true
    const entry = buildEntry(c.script, ex, c.session?.id)
    const id = await db.journal.add(entry)
    if (c.session?.id) await db.sessions.update(c.session.id, { journalId: id })
    if (alive.current) setSavedId(id)
  }

  async function play(c: ConversationContext, ex: Exchange[]) {
    setTurn(undefined)
    const next = await provider.nextTurn({ context: c, exchanges: ex })
    for (const text of next.messages) {
      if (!alive.current) return
      setTyping(true)
      await sleep(reduced() ? 250 : Math.min(450 + text.length * 16, 1700))
      if (!alive.current) return
      setTyping(false)
      setItems((it) => [...it, { from: 'compagnon', text, safety: next.tone === 'safety' }])
    }
    if (next.actions?.length) setItems((it) => [...it, { from: 'actions', actions: next.actions!, safety: next.tone === 'safety' }])
    setTurn(next)
    if (next.end) await save(c, ex)
  }

  function answer(a: Answer) {
    if (!turn?.input || !ctx) return
    const ex: Exchange = { turnId: turn.id, question: turn.question ?? '', input: turn.input, answer: a }
    const all = [...exchanges, ex]
    setExchanges(all)
    const text = a.skipped ? t('Je préfère passer', 'Je préfère passer') : answerText(turn.input, a)
    setItems((it) => [...it, { from: 'moi', text, skipped: a.skipped }])
    void play(ctx, all)
  }

  async function stopAndSave() {
    if (!ctx) return
    setAskStop(false)
    setTurn(undefined)
    const tt = makeT(ctx.voice.tutoiement)
    setItems((it) => [
      ...it,
      { from: 'compagnon', text: tt('D’accord, on s’arrête là. Merci pour ce que tu as partagé : je le garde dans ton journal.', 'D’accord, on s’arrête là. Merci pour ce que vous avez partagé : je le garde dans votre journal.') },
    ])
    await save(ctx, exchanges)
  }

  if (!script) return <Navigate to="/compagnon" replace />
  if (!companion) return null

  const answered = exchanges.some((e) => e.turnId !== SAFETY_TURN && !e.answer.skipped)
  const finished = savedId !== undefined

  return (
    <div className="compagnon-talk">
      <header className="compagnon-talk-head">
        <Avatar companion={companion} size={44} mood={typing ? 'attentif' : 'neutre'} />
        <div className="compagnon-talk-title">
          <strong>{companion.name}</strong>
          <span className="muted">{typing ? 'écrit…' : 'une appli, pas une personne'}</span>
        </div>
        {!finished && (
          <button type="button" className="btn btn-ghost compagnon-stop" onClick={() => (answered ? setAskStop(true) : navigate('/compagnon'))}>
            Arrêter
          </button>
        )}
      </header>

      <div className="compagnon-thread" aria-live="polite">
        {items.map((it, i) =>
          it.from === 'actions' ? (
            <ActionList key={i} actions={it.actions} safety={it.safety} onBreathing={() => setBreathing(true)} />
          ) : (
            <p
              key={i}
              className={
                it.from === 'moi'
                  ? `compagnon-bubble me${it.skipped ? ' skipped' : ''}`
                  : `compagnon-bubble them${it.safety ? ' safety' : ''}`
              }
            >
              {it.text}
            </p>
          ),
        )}
        {typing && (
          <p className="compagnon-bubble them compagnon-typing" aria-label={`${companion.name} écrit`}>
            <span />
            <span />
            <span />
          </p>
        )}
      </div>

      {turn?.input && !finished && (
        <AnswerBox key={`${turn.id}-${exchanges.length}`} input={turn.input} skippable={turn.skippable !== false} t={t} onAnswer={answer} />
      )}

      {finished && (
        <div className="card card-soft compagnon-done">
          <p>
            <strong>✓ {t('C’est enregistré dans ton journal.', 'C’est enregistré dans votre journal.')}</strong>
          </p>
          <div className="btn-row">
            <Link className="btn" to="/compagnon/journal">
              {t('Relire mon journal', 'Relire mon journal')}
            </Link>
            <Link className="btn btn-secondary" to="/compagnon">
              Revenir au Confident
            </Link>
          </div>
        </div>
      )}
      <div ref={endRef} className="compagnon-end" />

      {askStop && (
        <Sheet title="On s’arrête là ?" onClose={() => setAskStop(false)}>
          <p>{t('Pas de souci, tu peux t’arrêter quand tu veux.', 'Pas de souci, vous pouvez vous arrêter quand vous voulez.')}</p>
          <div className="stack">
            <button type="button" className="btn btn-block" onClick={() => void stopAndSave()}>
              Garder ce que j’ai écrit dans mon journal
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => navigate('/compagnon')}>
              Ne rien garder
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setAskStop(false)}>
              Reprendre la conversation
            </button>
          </div>
        </Sheet>
      )}
      {breathing && <Breathing t={t} onClose={() => setBreathing(false)} />}
    </div>
  )
}

function ActionList({ actions, safety, onBreathing }: { actions: TurnAction[]; safety?: boolean; onBreathing: () => void }) {
  async function share(text: string) {
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch {
      return
    }
    window.location.href = `sms:?&body=${encodeURIComponent(text)}`
  }
  return (
    <div className={safety ? 'compagnon-actions safety' : 'compagnon-actions'}>
      {actions.map((a, i) => {
        if (a.kind === 'tel')
          return (
            <a key={i} className="compagnon-tel" href={`tel:${a.number}`}>
              <span className="compagnon-tel-num">📞 {a.label}</span>
              {a.detail && <span className="compagnon-tel-detail">{a.detail}</span>}
            </a>
          )
        if (a.kind === 'link')
          return (
            <Link key={i} className="btn btn-secondary" to={a.to}>
              {a.label}
            </Link>
          )
        if (a.kind === 'breathing')
          return (
            <button key={i} type="button" className="btn btn-secondary" onClick={onBreathing}>
              {a.label}
            </button>
          )
        return (
          <button key={i} type="button" className="btn btn-secondary" onClick={() => void share(a.text)}>
            💬 {a.label}
          </button>
        )
      })}
    </div>
  )
}

interface AnswerProps {
  input: InputSpec
  skippable: boolean
  t: T
  onAnswer: (a: Answer) => void
}

// Zone de réponse : pastilles, texte, échelle ou émotions, et toujours « Passer ».
function AnswerBox({ input, skippable, t, onAnswer }: AnswerProps) {
  const [values, setValues] = useState<string[]>([])
  const [text, setText] = useState('')
  const [num, setNum] = useState<number>()

  const toggle = (v: string) => setValues((vs) => (vs.includes(v) ? vs.filter((x) => x !== v) : [...vs, v]))
  const hasText = text.trim().length > 0

  let body: ReactNode = null
  let canSend = false
  let send = () => onAnswer({ values, text: text.trim() || undefined })

  if (input.kind === 'choice') {
    if (!input.multiple) {
      body = (
        <>
          <div className="compagnon-options" role="group" aria-label="Réponses proposées">
            {input.options.map((o) => (
              <button key={o.value} type="button" className="chip compagnon-option" onClick={() => onAnswer({ values: [o.value] })}>
                {o.label}
              </button>
            ))}
          </div>
          {input.allowText && (
            <TextInput value={text} onChange={setText} placeholder={input.placeholder ?? t('Ou avec tes mots…', 'Ou avec vos mots…')} />
          )}
        </>
      )
      canSend = hasText
      send = () => onAnswer({ text: text.trim() })
    } else {
      body = (
        <>
          <p className="muted compagnon-hint">{t('Tu peux en choisir plusieurs.', 'Vous pouvez en choisir plusieurs.')}</p>
          <Chips options={input.options} value={values} onChange={toggle} />
          {input.allowText && <TextInput value={text} onChange={setText} placeholder={input.placeholder ?? 'Autre chose…'} />}
        </>
      )
      canSend = values.length > 0 || hasText
    }
  } else if (input.kind === 'emotions') {
    body = (
      <>
        <p className="muted compagnon-hint">{t('Tu peux en choisir plusieurs.', 'Vous pouvez en choisir plusieurs.')}</p>
        <Chips options={EMOTIONS.map((e) => ({ value: e.value, label: `${e.emoji} ${e.label}` }))} value={values} onChange={toggle} />
        {input.allowText !== false && <TextInput value={text} onChange={setText} placeholder="Une autre émotion…" />}
      </>
    )
    canSend = values.length > 0 || hasText
  } else if (input.kind === 'scale') {
    body = <Scale label="Ma réponse, de 0 à 10" value={num} onChange={setNum} minLabel={input.minLabel} maxLabel={input.maxLabel} />
    canSend = num !== undefined
    send = () => onAnswer({ number: num })
  } else {
    body = <TextInput value={text} onChange={setText} placeholder={input.placeholder} long={input.long} autoFocus />
    canSend = hasText
    send = () => onAnswer({ text: text.trim() })
  }

  const showSend = !(input.kind === 'choice' && !input.multiple && !input.allowText)

  return (
    <form
      className="compagnon-answer"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) send()
      }}
    >
      {body}
      <div className="compagnon-answer-actions">
        {skippable && (
          <button type="button" className="btn btn-ghost" onClick={() => onAnswer({ skipped: true })}>
            Passer
          </button>
        )}
        {showSend && (
          <button type="submit" className="btn" disabled={!canSend}>
            Envoyer
          </button>
        )}
      </div>
    </form>
  )
}

function TextInput({ value, onChange, placeholder, long, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; long?: boolean; autoFocus?: boolean }) {
  return (
    <label className="field compagnon-text">
      <span className="compagnon-sr">Ma réponse</span>
      {long ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} autoFocus={autoFocus} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
      )}
    </label>
  )
}
