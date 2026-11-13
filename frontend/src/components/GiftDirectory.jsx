import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

const API_BASE = '/api'

function GiftDirectory() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/public/directory`)
      .then((response) => response.json())
      .then((data) => setVisible(Boolean(data.enabled) && data.lists.length > 0))
  }, [])

  if (!visible) return null

  return (
    <div className="gift-directory">
      <h3>{t("Looking for someone's wishlist?")}</h3>
      <Link to="/directory" className="btn-primary">
        {t('Browse wishlists')}
      </Link>
    </div>
  )
}

export default GiftDirectory
