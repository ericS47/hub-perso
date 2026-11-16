import PageShell from '../../ui/PageShell'

export default function APropos() {
  return (
    <PageShell title="À propos" subtitle="Ce que fait l’appli et ce qu’elle fait de tes données" backTo="/plus">
      <section className="card">
        <h2>Ce que fait l’appli</h2>
        <p>
          Mon Compagnon t’accompagne entre deux rendez-vous : planifier tes séances d’activité physique,
          dire comment elles se sont passées, confier un coup de mou, et savoir vers qui te tourner dans l’équipe.
        </p>
      </section>

      <section className="card card-warm">
        <h2>Ce qu’elle ne remplace pas</h2>
        <p>
          L’appli ne remplace ni un soignant, ni un avis médical, ni les urgences. Elle ne pose pas de diagnostic.
        </p>
        <ul className="plus-list">
          <li><strong>15</strong> : SAMU, urgence médicale</li>
          <li><strong>112</strong> : numéro d’urgence européen</li>
          <li><strong>3114</strong> : prévention du suicide, gratuit, 24 h/24 et 7 j/7</li>
        </ul>
        <div className="btn-row">
          <a className="btn btn-secondary" href="tel:15">Appeler le 15</a>
          <a className="btn btn-secondary" href="tel:3114">Appeler le 3114</a>
        </div>
      </section>

      <section className="card">
        <h2>Tes données</h2>
        <ul className="plus-list">
          <li>Tout ce que tu saisis est enregistré <strong>uniquement sur ce téléphone</strong>.</li>
          <li>Rien n’est envoyé sur internet : il n’y a ni compte, ni serveur.</li>
          <li>Personne de l’équipe ne voit tes réponses, sauf si tu choisis de les montrer.</li>
          <li>Si tu effaces les données du navigateur ou changes de téléphone, elles seront perdues.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Installer l’appli sur l’écran d’accueil</h2>
        <h3>📱 iPhone (Safari)</h3>
        <ol className="plus-list">
          <li>Ouvre l’appli dans <strong>Safari</strong>.</li>
          <li>Touche le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut).</li>
          <li>Choisis <strong>« Sur l’écran d’accueil »</strong>, puis <strong>Ajouter</strong>.</li>
        </ol>
        <h3>🤖 Android (Chrome)</h3>
        <ol className="plus-list">
          <li>Ouvre l’appli dans <strong>Chrome</strong>.</li>
          <li>Touche le menu <strong>⋮</strong> en haut à droite.</li>
          <li>Choisis <strong>« Installer l’application »</strong> ou <strong>« Ajouter à l’écran d’accueil »</strong>.</li>
        </ol>
        <p className="muted">L’icône apparaît alors avec tes autres applications.</p>
      </section>
    </PageShell>
  )
}
