'use client';

import { extractItem, extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAllTenants,
	getTenantDetail,
	createTenant,
	updateTenant,
	deleteTenant,
	activateTenant,
	suspendTenant,
} from '@/lib/api.generated';

export type TenantListResponse = Record<string, unknown>;

export type TenantDetail = Record<string, unknown>;

export function useTenants() {
	return useQuery({
		queryKey: queryKeys.tenants.all,
		staleTime: 60000,
		queryFn: async () => {
			const res = await getAllTenants();
			const payload = extractItem<TenantListResponse>(res) ?? res;
			const items = payload?.items ?? payload;
			return Array.isArray(items) ? items : [];
		},
	});
}

export function useTenant(id: string) {
	return useQuery({
		queryKey: queryKeys.tenants.detail(id),
		staleTime: 60000,
		queryFn: async () => {
			const res = await getTenantDetail(id);
			return extractItem<TenantDetail>(res) ?? res;
		},
		enabled: !!id,
	});
}

export function useCreateTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createTenant,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all }),
	});
}

export function useUpdateTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			updateTenant(id, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all }),
	});
}

export function useDeleteTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteTenant,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all }),
	});
}

export function useActivateTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: activateTenant,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all }),
	});
}

export function useSuspendTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: suspendTenant,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all }),
	});
}
