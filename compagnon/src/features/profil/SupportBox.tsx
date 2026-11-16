// Encart de soutien affiché avec tact quand le moral est très bas. Pas d'alarme, pas de diagnostic.
export default function SupportBox() {
  return (
    <aside className="card card-warm profil-support" aria-label="Tu n’es pas seul">
      <h3>💛 Tu n’es pas seul·e</h3>
      <p>Merci de l’avoir dit. Quand le moral est très bas, en parler fait souvent du bien : n’hésite pas à en discuter avec ton soignant.</p>
      <p>Si tu as des idées noires ou besoin de parler maintenant, des personnes sont là pour t’écouter :</p>
      <div className="profil-support-links">
        <a className="btn btn-secondary" href="tel:3114">
          📞 3114 — gratuit, 24 h/24
        </a>
        <a className="btn btn-secondary" href="tel:15">
          🚑 15 — en cas d’urgence
        </a>
      </div>
      <p className="profil-hint">Le 3114 est le numéro national de prévention du suicide.</p>
    </aside>
  )
}
