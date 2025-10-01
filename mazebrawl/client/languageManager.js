// mazebrawl/client/LanguageManager.js

export default class LanguageManager {
  constructor(scene) {
    this.scene = scene;
    this.translations = {};
    this.currentLang = localStorage.getItem('gameLanguage') || 'en';
  }

  async loadLanguage(lang) {
    try {
      const response = await fetch(`locales/${lang}.json`);
      this.translations = await response.json();
      this.currentLang = lang;
      localStorage.setItem('gameLanguage', lang);
      console.log(`${lang} language pack loaded.`);
    } catch (error) {
      console.error(`Failed to load language pack for ${lang}:`, error);
      //fallback to English if loading fails
      if (lang !== 'en') {
        await this.loadLanguage('en');
      }
    }
  }

  get(key) {
    return this.translations[key] || key; //return the key itself if not found
  }
}
