import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

// Lecteur de codes-barres (EAN/UPC) par la caméra. Safari sur iPhone ne sait
// pas lire les codes-barres seul : la bibliothèque ZXing s'en charge, chargée
// seulement à l'ouverture du scanner. Plan B : une photo du code-barres.
async function makeReader() {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ])
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ])
  hints.set(DecodeHintType.TRY_HARDER, true)
  return new BrowserMultiFormatReader(hints)
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'starting' | 'scanning' | 'nocamera' | 'reading' | 'notfound'>('starting')

  useEffect(() => {
    let stream: MediaStream | undefined
    let stopReading: (() => void) | undefined
    let done = false
    const stopAll = () => {
      stopReading?.()
      stream?.getTracks().forEach((t) => t.stop())
    }
    ;(async () => {
      try {
        // Caméra ouverte ici (caméra arrière de préférence), lecture confiée à ZXing.
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        const video = videoRef.current
        if (done || !video) return stopAll()
        video.srcObject = stream
        await video.play()
        const reader = await makeReader()
        if (done) return stopAll()
        const controls = await reader.decodeFromVideoElement(video, (result) => {
          if (!result || done) return
          done = true
          stopAll()
          navigator.vibrate?.(80)
          onDetected(result.getText())
        })
        stopReading = () => controls.stop()
        if (done) stopAll()
        else setState('scanning')
      } catch {
        // Caméra refusée ou absente : il reste la photo.
        stopAll()
        if (!done) setState('nocamera')
      }
    })()
    return () => {
      done = true
      stopAll()
    }
  }, [onDetected])

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setState('reading')
    const url = URL.createObjectURL(file)
    try {
      const result = await (await makeReader()).decodeFromImageUrl(url)
      onDetected(result.getText())
    } catch {
      setState('notfound')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Sheet title="📷 Scanner le code-barres" onClose={onClose}>
      <div className="scanner">
        <video ref={videoRef} className="scanner-video" muted playsInline aria-label="Image de la caméra" />
        <span className="scanner-frame" aria-hidden="true" />
      </div>
      <p className={state === 'notfound' ? 'round-hint warn' : 'round-hint'} role="status">
        {state === 'starting'
          ? 'Ouverture de la caméra…'
          : state === 'scanning'
            ? 'Vise le code-barres de la boîte, bien à plat et éclairé'
            : state === 'nocamera'
              ? "Caméra indisponible ou refusée : prends plutôt une photo du code-barres"
              : state === 'reading'
                ? 'Lecture de la photo…'
                : 'Code-barres illisible sur cette photo : rapproche-toi et évite les reflets'}
      </p>
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
          📸 Prendre une photo du code-barres
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
    </Sheet>
  )
}
