import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import i18n from '../index';

// PL-28 回归锁：dayjs 全局区须随 i18n 语言切换同步
// （antd 控件表头由 dayjs 渲染，不同步会出现「2026年Oct」中英混排）。
const ready = i18n.isInitialized
	? Promise.resolve()
	: new Promise<void>((resolve) => i18n.on('initialized', () => resolve()));

describe('i18n locale side effects', () => {
	it('keeps dayjs locale in sync with the i18n language', async () => {
		await ready;
		await i18n.changeLanguage('zh-CN');
		expect(dayjs.locale()).toBe('zh-cn');
		await i18n.changeLanguage('en-US');
		expect(dayjs.locale()).toBe('en');
	});

	it('syncs <html lang> with the i18n language', async () => {
		await ready;
		await i18n.changeLanguage('zh-CN');
		expect(document.documentElement.lang).toBe('zh-CN');
		await i18n.changeLanguage('en-US');
		expect(document.documentElement.lang).toBe('en-US');
	});
});
