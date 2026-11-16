import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CompanionSettings } from '../../../db'
import { getSetting, setSetting } from '../../../lib/settings'
import PageShell from '../../../ui/PageShell'
import Avatar from '../Avatar'
import CompanionPicker from '../CompanionPicker'

// Modifier le compagnon et le prénom à tout moment (enregistré au fil de l'eau).
export default function Customize() {
  const [companion, setCompanion] = useState<CompanionSettings>()
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    void Promise.all([getSetting('companion'), getSetting('firstName')]).then(([c, f]) => {
      setCompanion(c)
      setFirstName(f)
    })
  }, [])

  if (!companion) return null

  const update = (c: CompanionSettings) => {
    setCompanion(c)
    // Un nom vide n'est pas enregistré : on garde le précédent.
    if (c.name.trim()) void setSetting('companion', c)
    else void setSetting('companion', { ...c, name: 'Bondi' })
  }

  return (
    <PageShell title={`Personnaliser ${companion.name.trim() || 'mon compagnon'}`} subtitle="Les changements sont enregistrés tout de suite." backTo="/compagnon">
      <div className="compagnon-center compagnon-preview">
        <Avatar companion={companion} size={120} mood="content" />
        <strong>{companion.name}</strong>
      </div>
      <CompanionPicker value={companion} onChange={update} />
      <label className="field">
        <span>Mon prénom ou surnom</span>
        <input
          value={firstName}
          maxLength={30}
          onChange={(e) => {
            setFirstName(e.target.value)
            void setSetting('firstName', e.target.value.trim())
          }}
        />
      </label>
      <Link to="/compagnon/bienvenue" className="btn btn-ghost">
        Revoir la présentation
      </Link>
    </PageShell>
  )
}
