import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en/translation.json"

// All UI copy lives in ./locales/<lang>/translation.json — add a new
// locale file + register it in `resources` below when translating.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
