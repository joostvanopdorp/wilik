import { Link } from 'react-router-dom'
import GiftDirectoryList from '../components/GiftDirectoryList'
import { useI18n } from '../i18n'

function WishlistBrowsePage() {
  const { t } = useI18n()
  return (
    <div className="page">
      <Link className="page__back" to="/wishlist">
        {t('← Back')}
      </Link>
      <h2>{t('All wishlists')}</h2>
      <GiftDirectoryList />
    </div>
  )
}

export default WishlistBrowsePage
