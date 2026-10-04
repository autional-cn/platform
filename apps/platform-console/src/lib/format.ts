import i18n from '@/i18n';

function getLocale(): string {
	return (i18n.language || '').startsWith('zh') ? 'zh-CN' : 'en-US';
}

// 与公开状态页（sites/status lib/format）同口径：i18n 驱动 locale 的本地化时间。
// 后端时间戳为 ISO 微秒串（如 2026-10-04T10:09:44.867123Z），直接渲染不可读（PL-24）。
export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString(getLocale(), {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}
