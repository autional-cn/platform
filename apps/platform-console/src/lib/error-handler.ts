import { message } from '@/lib/antd-app';

const notify = (msg: string) => message.error(msg);

export function handleApiError(err: unknown, fallback?: string): void {
	const msg = extractApiErrorMessage(err);
	notify(fallback || msg);
}

export function extractApiErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string') return err;
	if (err && typeof err === 'object' && 'message' in err) return String((err as any).message);
	return 'An unexpected error occurred';
}
