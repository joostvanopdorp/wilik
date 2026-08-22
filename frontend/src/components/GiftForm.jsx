import { useState, useEffect } from 'react'
import StarRating from './StarRating'
import { CURRENCY_OPTIONS } from '../formOptions'

const API_BASE = '/api'

function GiftForm({ initialValues, defaultCurrency, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    title: initialValues?.title ?? '',
    label: initialValues?.label ?? '',
    brand: initialValues?.brand ?? '',
    options: initialValues?.options ?? '',
    url: initialValues?.url ?? '',
    image_url: initialValues?.image_url ?? '',
    description: initialValues?.description ?? '',
    price: initialValues?.price ?? '',
    currency: initialValues?.currency ?? '__default__',
    quantity: initialValues?.quantity ?? 1,
  })
  const [unlimited, setUnlimited] = useState(initialValues ? initialValues.quantity == null : false)
  const [rating, setRating] = useState(initialValues?.rating ?? null)
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState(null)
  const [imagePreviewError, setImagePreviewError] = useState(false)

  useEffect(() => {
    setImagePreviewError(false)
  }, [values.image_url])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleFetchDetails() {
    setScraping(true)
    setScrapeError(null)
    fetch(`${API_BASE}/scrape`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: values.url }),
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setScrapeError(data.error || 'Could not fetch details for that URL')
          return
        }
        setValues((current) => ({
          ...current,
          title: data.title || current.title,
          image_url: data.image_url || current.image_url,
          brand: data.brand || current.brand,
          price: data.price != null ? data.price : current.price,
        }))
      })
      .catch(() => setScrapeError('Could not fetch details for that URL'))
      .finally(() => setScraping(false))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      ...values,
      price: values.price === '' ? null : Number(values.price),
      currency: values.currency === '__default__' ? null : values.currency,
      quantity: unlimited ? null : Number(values.quantity) || 1,
      rating,
    })
  }

  return (
    <form className="gift-form" onSubmit={handleSubmit}>
      <label>
        URL
        <span className="inline-field">
          <input name="url" value={values.url} onChange={handleChange} placeholder="https://..." />
          <button
            type="button"
            className="btn-primary"
            onClick={handleFetchDetails}
            disabled={!values.url || scraping}
          >
            {scraping ? 'Fetching…' : 'Fetch details'}
          </button>
        </span>
      </label>
      {scrapeError && <p className="form-error">{scrapeError}</p>}
      <label>
        Image URL
        <input name="image_url" value={values.image_url} onChange={handleChange} placeholder="https://..." />
      </label>
      {values.image_url && !imagePreviewError && (
        <img
          src={values.image_url}
          alt="Preview"
          className="gift-form__image-preview"
          onError={() => setImagePreviewError(true)}
        />
      )}
      <div className="gift-form__row">
        <label>
          Label
          <input name="label" value={values.label} onChange={handleChange} placeholder="e.g. Board game, Perfume, Book ..." />
        </label>
        <label>
          Brand, creator or seller
          <input name="brand" value={values.brand} onChange={handleChange} placeholder="e.g. 999 Games, Chanel, George Orwell ..." />
        </label>
      </div>
      <label>
        <span>
          Title <span className="required">*</span>
        </span>
        <input
          name="title"
          value={values.title}
          onChange={handleChange}
          placeholder="e.g. Rummikub, Bleu de Chanel, Animal Farm ..."
          required
        />
      </label>
      <label>
        Product options (separate with semicolons)
        <input
          name="options"
          value={values.options}
          onChange={handleChange}
          placeholder="e.g. Medium; 50ml; Black, blue or yellow"
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Any extra details worth mentioning"
        />
      </label>
      <div className="gift-form__row">
        <label>
          Price
          <input
            name="price"
            type="number"
            step="any"
            value={values.price}
            onChange={handleChange}
            placeholder="0,00"
          />
        </label>
        <label>
          Currency
          <select name="currency" value={values.currency} onChange={handleChange}>
            <option value="__default__">Default ({defaultCurrency || 'no symbol'})</option>
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantity
          <input
            name="quantity"
            type="number"
            min="1"
            value={unlimited ? '' : values.quantity}
            onChange={handleChange}
            disabled={unlimited}
          />
        </label>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={unlimited} onChange={(event) => setUnlimited(event.target.checked)} />
        Unlimited (anyone can claim a copy, it never runs out)
      </label>
      <label>
        Rating
        <StarRating value={rating} onChange={setRating} />
      </label>
      <div className="gift-form__actions">
        <button type="submit">Save</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default GiftForm
