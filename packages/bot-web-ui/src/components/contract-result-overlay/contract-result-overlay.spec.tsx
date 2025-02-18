import React from 'react';
import { mockStore, StoreProvider } from '@deriv/stores';
// eslint-disable-next-line import/no-extraneous-dependencies
import { render, screen } from '@testing-library/react';
import { mock_ws } from 'Utils/mock';
import RootStore from 'Stores/index';
import { DBotStoreProvider, mockDBotStore } from 'Stores/useDBotStore';
import ContractResultOverlay from './contract-result-overlay';

jest.mock('@deriv/bot-skeleton/src/scratch/blockly', () => jest.fn());
jest.mock('@deriv/bot-skeleton/src/scratch/dbot', () => ({
    saveRecentWorkspace: jest.fn(),
    unHighlightAllBlocks: jest.fn(),
}));
jest.mock('@deriv/bot-skeleton/src/scratch/hooks/block_svg', () => jest.fn());
jest.mock('@deriv/deriv-charts', () => ({
    setSmartChartsPublicPath: jest.fn(),
}));

describe('ContractResultOverlay', () => {
    let wrapper: ({ children }: { children: JSX.Element }) => JSX.Element, mock_DBot_store: RootStore | undefined;

    beforeEach(() => {
        jest.resetModules();
        const mock_store = mockStore({});
        mock_DBot_store = mockDBotStore(mock_store, mock_ws);

        wrapper = ({ children }: { children: JSX.Element }) => (
            <StoreProvider store={mock_store}>
                <DBotStoreProvider ws={mock_ws} mock={mock_DBot_store}>
                    {children}
                </DBotStoreProvider>
            </StoreProvider>
        );
    });

    it('should render the ContractResultOverlay component', () => {
        const { container } = render(<ContractResultOverlay profit={0} className={''} />, {
            wrapper,
        });
        expect(container).toBeInTheDocument();
    });

    it('should show contract won', () => {
        render(<ContractResultOverlay profit={0} className={''} />, {
            wrapper,
        });
        expect(screen.getByText('Won')).toBeInTheDocument();
    });

    it('should show contract lost', () => {
        render(<ContractResultOverlay profit={-1} className={''} />, {
            wrapper,
        });
        expect(screen.getByText('Lost')).toBeInTheDocument();
    });
});
