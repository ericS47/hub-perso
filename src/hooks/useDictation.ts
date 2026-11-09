import { useEffect, useRef, useState } from 'react'

// Types minimaux de l'API Web Speech, absente des types DOM de TypeScript.
interface RecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}
interface RecognitionEvent {
  resultIndex: number
  results: ArrayLike<RecognitionResult>
}
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Micro refusé : autorise le micro pour ce site dans les réglages du navigateur.',
  'service-not-allowed': "La dictée n'est pas autorisée sur cet appareil.",
  'audio-capture': 'Aucun micro disponible.',
  'no-speech': 'Aucune voix détectée, réessaie.',
  network: 'La dictée a besoin d’une connexion internet.',
}

// Dictée vocale en français : onFinal reçoit chaque phrase reconnue.
export function useDictation(onFinal: (text: string) => void) {
  const [supported] = useState(() => recognitionCtor() !== undefined)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  })

  // Arrête la dictée si l'utilisateur quitte la page.
  useEffect(() => () => recognition.current?.stop(), [])

  function start() {
    const Ctor = recognitionCtor()
    if (!Ctor || recognition.current) return
    const rec = new Ctor()
    rec.lang = 'fr-FR'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let pending = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) onFinalRef.current(result[0].transcript.trim())
        else pending += result[0].transcript
      }
      setInterim(pending)
    }
    rec.onerror = (e) => {
      // « aborted » survient quand on arrête soi-même : ce n'est pas une erreur.
      if (e.error !== 'aborted') setError(ERRORS[e.error] ?? 'La dictée s’est arrêtée.')
    }
    rec.onend = () => {
      recognition.current = null
      setListening(false)
      setInterim('')
    }
    setError(null)
    recognition.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      recognition.current = null
      setError('Impossible de démarrer la dictée.')
    }
  }

  function stop() {
    recognition.current?.stop()
  }

  return { supported, listening, interim, error, start, stop }
}
