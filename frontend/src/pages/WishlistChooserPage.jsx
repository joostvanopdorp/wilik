import { Link } from 'react-router-dom'
import { UserIcon, GiftIcon } from '../components/Icons'
import { useI18n } from '../i18n'

function WishlistChooserPage() {
  const { t } = useI18n()
  return (
    <div className="page">
      <h2>{t('Wishlists')}</h2>

      <div className="card">
        <h3 className="card__heading">
          <UserIcon /> {t('My wishlist')}
        </h3>
        <p className="page__hint" style={{ margin: '0 0 10px' }}>
          {t('See and manage the items on your own wishlist')}
        </p>
        <Link to="/" className="btn-primary">
          {t('Go to my wishlist')}
        </Link>
      </div>

      <div className="card">
        <h3 className="card__heading">
          <GiftIcon /> {t('All wishlists')}
        </h3>
        <p className="page__hint" style={{ margin: '0 0 10px' }}>
          {t("Browse everyone's wishlists, so you can claim something to give them")}
        </p>
        <Link to="/wishlist/browse" className="btn-primary">
          {t('Browse wishlists')}
        </Link>
      </div>
    </div>
  )
}

export default WishlistChooserPage
