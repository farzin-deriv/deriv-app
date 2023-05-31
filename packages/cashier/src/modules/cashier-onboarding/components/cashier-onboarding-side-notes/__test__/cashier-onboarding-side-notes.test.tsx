import React from 'react';
import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import CashierProviders from '../../../../../cashier-providers';
import CashierOnboardingSideNotes from '../cashier-onboarding-side-notes';

describe('CashierOnboardingSideNotes', () => {
    test('should render CashierOnboardingSideNoteFiat on mobile if is_crypto is false', async () => {
        const mock = mockStore({ ui: { is_mobile: true } });

        const wrapper = ({ children }: { children: JSX.Element }) => (
            <CashierProviders store={mock}>{children}</CashierProviders>
        );
        render(<CashierOnboardingSideNotes />, { wrapper });

        expect(screen.getByText(/If you want to change your account currency/i)).toBeInTheDocument();
    });

    test('should render CashierOnboardingSideNoteCrypto on mobile on mobile if is_crypto is true', async () => {
        const mock = mockStore({
            ui: { is_mobile: true },
            client: { is_crypto: () => true },
            modules: {
                cashier: {
                    general_store: {
                        setDepositTarget: jest.fn(),
                    },
                },
            },
        });

        const wrapper = ({ children }: { children: JSX.Element }) => (
            <CashierProviders store={mock}>{children}</CashierProviders>
        );
        render(<CashierOnboardingSideNotes />, { wrapper });

        expect(screen.getByText(/You can open another cryptocurrency account/i)).toBeInTheDocument();
    });
});
