import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  title: string
  subtitle?: string
  // Lien de retour ; absent sur les pages racines des onglets.
  backTo?: string
  children: ReactNode
}

// Gabarit commun à toutes les pages : retour, titre et contenu.
export default function PageShell({ title, subtitle, backTo, children }: Props) {
  return (
    <div>
      {backTo && <Link to={backTo} className="back-link">← Retour</Link>}
      <header className="page-head">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>
      {children}
    </div>
  )
}
