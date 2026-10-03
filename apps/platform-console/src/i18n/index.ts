import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			'zh-CN': { translation: zhCN },
			en: { translation: enUS },
			// LanguageSwitcher 切 'en-US'；别名指向同一资源，避免切换“无效果”
			'en-US': { translation: enUS },
		},
		fallbackLng: 'zh-CN',
		keySeparator: false,
		interpolation: { escapeValue: false },
	});

export default i18n;
