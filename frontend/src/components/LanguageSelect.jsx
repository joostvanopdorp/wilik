import { useI18n } from '../i18n'

function LanguageSelect() {
  const { language, languages, setLanguage, t } = useI18n()

  return (
    <label className="language-select">
      <span className="sr-only">{t('Language')}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('Language')}>
        {Object.entries(languages).map(([code, details]) => (
          <option key={code} value={code}>
            {details.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export default LanguageSelect
