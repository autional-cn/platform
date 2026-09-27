'use client';

import { useAuthStore } from '@autional-cn/shared';

/**
 * 获取当前租户 ID
 * 优先从 @autional-cn/shared 的 auth store 读取
 */
export function useTenantId(): string {
	return useAuthStore((s) => s.currentTenantId) ?? '';
}

/**
 * 获取当前租户 ID（带 fallback）
 */
export function useTenantIdOr(fallback: string): string {
	return useAuthStore((s) => s.currentTenantId) || fallback;
}
