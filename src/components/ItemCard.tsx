import { db, type CultureItem, type CultureList } from '../db'
import { categoryOf } from '../culture/categories'

interface Props {
  item: CultureItem
  lists: CultureList[]
}

export default function ItemCard({ item, lists }: Props) {
  const icon = categoryOf(item.category)?.icon ?? '🎞️'

  async function update(changes: Partial<CultureItem>) {
    if (item.id === undefined) return
    await db.items.update(item.id, changes)
  }

  async function toggleList(listId: number) {
    const has = item.listIds.includes(listId)
    await update({
      listIds: has ? item.listIds.filter((id) => id !== listId) : [...item.listIds, listId],
    })
  }

  async function remove() {
    if (item.id === undefined) return
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return
    await db.items.delete(item.id)
  }

  return (
    <article className={item.priority ? 'item-card priority' : 'item-card'}>
      <div className="cover">
        {item.cover ? (
          <img src={item.cover} alt={`Couverture de ${item.title}`} loading="lazy" />
        ) : (
          <span className="cover-placeholder" aria-hidden="true">{icon}</span>
        )}
      </div>
      <h3 className="item-title">{item.title}</h3>

      <div className="badges">
        <button
          type="button"
          className={item.seen ? 'badge on' : 'badge'}
          aria-pressed={item.seen}
          onClick={() => update({ seen: !item.seen })}
        >
          ✓ Vu
        </button>
        <button
          type="button"
          className={item.priority ? 'badge on priority' : 'badge'}
          aria-pressed={item.priority}
          onClick={() => update({ priority: !item.priority })}
        >
          ★ Priorité
        </button>
      </div>

      {lists.length > 0 && (
        <div className="list-toggles">
          {lists.map((l) => (
            <label key={l.id} className="list-toggle">
              <input
                type="checkbox"
                checked={item.listIds.includes(l.id as number)}
                onChange={() => toggleList(l.id as number)}
              />
              {l.name}
            </label>
          ))}
        </div>
      )}

      <button type="button" className="link-btn small-link" onClick={remove}>
        Supprimer
      </button>
    </article>
  )
}
