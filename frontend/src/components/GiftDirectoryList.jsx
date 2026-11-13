import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SparkleIcon, UserIcon } from './Icons'
import { themeStyle } from '../themePresets'
import { useI18n } from '../i18n'

const API_BASE = '/api'

function GiftDirectoryList() {
  const { t } = useI18n()
  const [lists, setLists] = useState(undefined) // undefined = loading

  useEffect(() => {
    fetch(`${API_BASE}/public/directory`)
      .then((response) => response.json())
      .then((data) => setLists(data.enabled ? data.lists : []))
  }, [])

  if (lists === undefined) return null

  if (lists.length === 0) {
    return (
      <div className="empty-state">
        <SparkleIcon />
        <h3>{t('No wishlists available')}</h3>
        <p>{t('Either there are none yet, or the owner turned this overview off')}</p>
      </div>
    )
  }

  return (
    <ul className="gift-directory__list gift-directory__list--page">
      {lists.map((list) => (
        <li key={list.share_token}>
          <Link to={`/list/${list.share_token}`} style={themeStyle(list.theme_color)}>
            <span className="gift-directory__item-name">{list.list_name}</span>
            <span className="gift-directory__badge">
              <UserIcon /> {list.username}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default GiftDirectoryList
