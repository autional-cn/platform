'use client';

import { apiClient, extractItem } from '@autional-cn/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export interface CaptchaConfig {
	provider: 'pow' | 'turnstile';
	powDifficulty: number; // 1-10, default 4
	challengeTtl: number; // seconds: 60, 180, 300, 600 (default 300)
	fallbackMode: 'strict' | 'delay_only' | 'bypass';
}

const DEFAULT_CAPTCHA_CONFIG: CaptchaConfig = {
	provider: 'pow',
	powDifficulty: 4,
	challengeTtl: 300,
	fallbackMode: 'strict',
};

export function useCaptchaConfig() {
	return useQuery<CaptchaConfig>({
		queryKey: queryKeys.security.captchaConfig,
		staleTime: 30000,
		queryFn: async () => {
			try {
				const res = await apiClient.get('/admin/security/captcha-config'); // @generated-api-exempt — no generated API yet
				const data = extractItem<CaptchaConfig>(res);
				if (data) {
					return data;
				}
			} catch {
				console.warn('[captcha] 获取 CAPTCHA 配置失败，使用默认配置');
			}
			return { ...DEFAULT_CAPTCHA_CONFIG };
		},
	});
}

export function useUpdateCaptchaConfig() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CaptchaConfig) => apiClient.put('/admin/security/captcha-config', data), // @generated-api-exempt — no generated API yet
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.security.captchaConfig }),
	});
}
