'use client';

import { extractItem } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import type {
	CommunicationDashboardResponse,
	NotificationStatsResponse,
} from '@autional-cn/shared/generated/types';
import { useQuery } from '@tanstack/react-query';
import { getPlatformCommunicationStats, getPlatformNotificationStats } from '@/lib/api.generated';

export function usePlatformCommunicationStats() {
	return useQuery({
		queryKey: queryKeys.platform.communicationStats,
		staleTime: 30000,
		queryFn: async () => {
			const res = await getPlatformCommunicationStats();
			const data = extractItem<CommunicationDashboardResponse>(res);
			return (
				data ?? {
					totalSent: 0,
					delivered: 0,
					failed: 0,
					deliveryRate: 0,
					byChannel: {},
					byStatus: {},
				}
			);
		},
	});
}

export function usePlatformNotificationStats() {
	return useQuery({
		queryKey: queryKeys.platform.notificationStats,
		staleTime: 30000,
		queryFn: async () => {
			try {
				const res = await getPlatformNotificationStats();
				const data = extractItem<NotificationStatsResponse>(res);
				return data ?? { totalSent: 0, totalRead: 0, readRate: 0, byType: {} };
			} catch (e) {
				console.warn('[usePlatformNotificationStats] API 失败，使用默认值 0:', e);
				return { totalSent: 0, totalRead: 0, readRate: 0, byType: {} };
			}
		},
	});
}
