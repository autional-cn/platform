import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/layout/Header';

const mockUser = vi.hoisted(() => ({
	email: 'test@example.com' as string | null,
	username: 'test',
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: {
			language: 'zh-CN',
			changeLanguage: vi.fn(),
		},
	}),
	initReactI18next: {
		type: '3rdParty',
		init: () => {},
	},
}));

vi.mock('@autional-cn/shared', () => ({
	useAuth: () => ({ user: mockUser, isAuthenticated: true }),
	getADMIN_CONSOLE_URL: () => 'http://localhost:13002/admin',
}));

describe('Header', () => {
	beforeEach(() => {
		mockUser.email = 'test@example.com';
	});

	it('renders the brand text', () => {
		render(<Header />);
		expect(screen.getByText('app.brand')).toBeInTheDocument();
	});

	it('renders the user email', () => {
		render(<Header />);
		expect(screen.getByText('test@example.com')).toBeInTheDocument();
	});

	it('renders the switch to tenant management button', () => {
		render(<Header />);
		expect(screen.getByText('nav.switchToTenantMgmt')).toBeInTheDocument();
	});

	it('navigates to tenant management on button click', async () => {
		const hrefSetter = vi.fn();
		const originalLocation = window.location;
		delete (window as any).location;
		(window as any).location = {
			href: '',
			get host() {
				return originalLocation.host;
			},
			set host(v) {},
		};
		Object.defineProperty(window.location, 'href', {
			set: hrefSetter,
			get: () => 'http://localhost:13110/',
		});

		const user = userEvent.setup();
		render(<Header />);

		await user.click(screen.getByText('nav.switchToTenantMgmt'));

		expect(hrefSetter).toHaveBeenCalledWith('http://localhost:13002/admin');

		window.location = originalLocation;
	});

	it('does not render email when user has no email', async () => {
		mockUser.email = null;

		render(<Header />);
		expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
	});
});
