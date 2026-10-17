import { useState } from 'react'
import ImagePlaceholder from './ImagePlaceholder'

// The gift's photo, or the placeholder when it has none or its link no longer
// loads. With showPlaceholder off (a user setting), both cases show nothing.
function GiftImage({ gift, showPlaceholder = true }) {
  // remembering the URL that failed (not a flag) means an edited URL is tried again
  const [failedUrl, setFailedUrl] = useState(null)

  if (gift.image_url && gift.image_url !== failedUrl) {
    return (
      <img
        className="gift-card__img"
        src={gift.image_url}
        alt={gift.title}
        onError={() => setFailedUrl(gift.image_url)}
      />
    )
  }
  return showPlaceholder ? <ImagePlaceholder id={gift.id} /> : null
}

export default GiftImage
