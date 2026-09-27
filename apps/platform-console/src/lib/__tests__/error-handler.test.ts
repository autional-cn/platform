import { describe, it, expect, vi } from 'vitest';

const mockMessageError = vi.fn();

vi.mock('@/lib/antd-app', () => ({
	message: {
		get error() {
			return mockMessageError;
		},
	},
}));

import { handleApiError, extractApiErrorMessage } from '@/lib/error-handler';

describe('extractApiErrorMessage', () => {
	it('extracts message from Error instances', () => {
		const err = new Error('Something broke');
		expect(extractApiErrorMessage(err)).toBe('Something broke');
	});

	it('returns the string as-is for string errors', () => {
		expect(extractApiErrorMessage('Network timeout')).toBe('Network timeout');
	});

	it('extracts message from axios-like error objects', () => {
		const err = { message: 'Request failed with status code 500', code: 500 };
		expect(extractApiErrorMessage(err)).toBe('Request failed with status code 500');
	});

	it('returns fallback message for null input', () => {
		expect(extractApiErrorMessage(null)).toBe('An unexpected error occurred');
	});

	it('returns fallback message for undefined input', () => {
		expect(extractApiErrorMessage(undefined)).toBe('An unexpected error occurred');
	});

	it('returns fallback message for objects without message property', () => {
		expect(extractApiErrorMessage({ code: 500 })).toBe('An unexpected error occurred');
	});

	it('returns fallback message for numbers', () => {
		expect(extractApiErrorMessage(42)).toBe('An unexpected error occurred');
	});
});

describe('handleApiError', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('calls message.error with the extracted error message', () => {
		handleApiError(new Error('Login failed'));
		expect(mockMessageError).toHaveBeenCalledWith('Login failed');
	});

	it('calls message.error with fallback when provided', () => {
		handleApiError(null, 'Something went wrong');
		expect(mockMessageError).toHaveBeenCalledWith('Something went wrong');
	});

	it('uses fallback message when both error and custom fallback are provided', () => {
		handleApiError('Real error message', 'Fallback');
		expect(mockMessageError).toHaveBeenCalledWith('Fallback');
	});

	it('calls message.error with default fallback for unknown errors without custom fallback', () => {
		handleApiError(null);
		expect(mockMessageError).toHaveBeenCalledWith('An unexpected error occurred');
	});

	it('handles axios-like error objects', () => {
		handleApiError({ message: 'Server error', status: 503 });
		expect(mockMessageError).toHaveBeenCalledWith('Server error');
	});
});
