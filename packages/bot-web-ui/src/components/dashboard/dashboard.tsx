import React, { useEffect } from 'react';
import classNames from 'classnames';
import { updateWorkspaceName } from '@deriv/bot-skeleton';
import dbot from '@deriv/bot-skeleton/src/scratch/dbot';
import { initTrashCan } from '@deriv/bot-skeleton/src/scratch/hooks/trashcan';
import { api_base } from '@deriv/bot-skeleton/src/services/api/api-base';
import { DesktopWrapper, Dialog, MobileWrapper, Tabs } from '@deriv/components';
import { isMobile } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { localize } from '@deriv/translations';
import Chart from 'Components/chart';
import { DBOT_TABS, TAB_IDS } from 'Constants/bot-contents';
import { useDBotStore } from 'Stores/useDBotStore';
import RunPanel from '../run-panel';
import RunStrategy from './dashboard-component/run-strategy';
import TourEndDialog from './dbot-tours/common/tour-end-dialog';
import TourStartDialog from './dbot-tours/common/tour-start-dialog';
import DesktopTours from './dbot-tours/desktop-tours';
import MobileTours from './dbot-tours/mobile-tours';
import { getTourSettings, setTourSettings, setTourType, tour_status_ended, tour_type } from './dbot-tours/utils';
import DashboardComponent from './dashboard-component';
import StrategyNotification from './strategy-notification';
import Tutorial from './tutorial-tab';

const Dashboard = observer(() => {
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useDBotStore();
    const {
        active_tab,
        has_tour_started,
        setTourActive,
        has_started_onboarding_tour,
        setOnBoardTourRunState,
        setBotBuilderTourState,
        setTourDialogVisibility,
        setHasTourEnded,
        has_started_bot_builder_tour,
        is_tour_dialog_visible,
        has_tour_ended,
        setActiveTab,
        setBotBuilderTokenCheck,
        setOnBoardingTokenCheck,
        setWebSocketState,
        onCloseTour,
    } = dashboard;
    const { onEntered, dashboard_strategies } = load_modal;
    const { is_dialog_open, is_drawer_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick } =
        run_panel;
    const { is_strategy_modal_open } = quick_strategy;
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER, CHART, TUTORIAL } = DBOT_TABS;
    const is_tour_complete = React.useRef(true);
    let bot_tour_token: string | number = '';
    let onboard_tour_token: string | number = '';
    let storage = '';
    let tour_status: { [key: string]: string };
    const is_mobile = isMobile();
    const init_render = React.useRef(true);
    const { ui } = useStore();
    const { url_hashed_values } = ui;

    let tab_value: number | string = active_tab;
    const GetHashedValue = (tab: number) => {
        tab_value = url_hashed_values?.split('#')[1];
        if (tab_value === 'dashboard') return DASHBOARD;
        if (tab_value === 'bot_builder') return BOT_BUILDER;
        if (tab_value === 'chart') return CHART;
        if (tab_value === 'tutorial') return TUTORIAL;
        if (isNaN(Number(tab_value)) || isNaN(tab)) return active_tab;
        if (Number(tab_value) > 4 || tab > 4) return active_tab;
        return tab_value;
    };
    const active_hash_tab = GetHashedValue(active_tab);

    const checkAndHandleConnection = () => {
        const api_status = api_base.getConnectionStatus();
        //added this check because after sleep mode all the store values refresh and is_running is false.
        const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
        if (is_bot_running && (api_status === 'Closed' || api_status === 'Closing')) {
            dbot.terminateBot();
            clear();
            setWebSocketState(false);
        }
    };

    React.useEffect(() => {
        window.addEventListener('focus', checkAndHandleConnection);
    }, []);

    React.useEffect(() => {
        if (init_render.current) {
            setActiveTab(Number(active_hash_tab));
            if (is_mobile) handleTabChange(Number(active_hash_tab));
            init_render.current = false;
        } else {
            let active_tab_name = 'dashboard';
            if (active_tab === 1) active_tab_name = 'bot_builder';
            if (active_tab === 2) active_tab_name = 'chart';
            if (active_tab === 3) active_tab_name = 'tutorial';
            window.location.hash = active_tab_name;
        }
    }, [active_tab]);

    const setTourStatus = (status: { [key: string]: string }) => {
        if (status) {
            const { action } = status;
            const actions = ['skip', 'close'];

            if (actions.includes(action)) {
                if (tour_type.key === 'bot_builder') {
                    setBotBuilderTourState(false);
                } else {
                    setOnBoardTourRunState(false);
                }
                setTourActive(false);
            }
        }
    };

    React.useEffect(() => {
        if (active_tab === BOT_BUILDER) {
            if (is_drawer_open) {
                initTrashCan(400, -748);
            } else {
                initTrashCan(20);
            }
            setTimeout(() => {
                window.dispatchEvent(new Event('resize')); // make the trash can work again after resize
            }, 500);
        }
        if (active_tab === DASHBOARD) {
            setTourType('onboard_tour');
            onboard_tour_token = getTourSettings('token');
            setOnBoardingTokenCheck(onboard_tour_token);
        }
        if (active_tab === BOT_BUILDER && !has_started_onboarding_tour) {
            setTourType('bot_builder');
            bot_tour_token = getTourSettings('token');
            setBotBuilderTokenCheck(bot_tour_token);
        }

        if (!is_tour_dialog_visible) {
            window.removeEventListener('storage', botStorageSetting);
        }
        tour_status = getTourSettings('onboard_tour_status');
        setTourStatus(tour_status);
    }, [active_tab, is_drawer_open, has_started_onboarding_tour, tour_status_ended, is_tour_dialog_visible]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (dashboard_strategies.length > 0) {
            // Needed to pass this to the Callback Queue as on tab changes
            // document title getting override by 'Bot | Deriv' only
            timer = setTimeout(() => {
                updateWorkspaceName();
            });
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [dashboard_strategies, active_tab]);

    const botStorageSetting = () => {
        tour_status = getTourSettings('bot_builder_status');
        const joyride_status_finished = tour_status_ended.key === 'finished';
        if (joyride_status_finished && !is_mobile) {
            if (tour_type.key === 'onboard_tour') {
                onCloseTour();
                tour_status_ended.key = '';
                return joyride_status_finished ?? null;
            }
            setTourDialogVisibility(true);

            setHasTourEnded(true);
            is_tour_complete.current = false;
            window.removeEventListener('storage', botStorageSetting);
        }
        setTourStatus(tour_status);
        bot_tour_token = getTourSettings('token');
        if (active_tab === 1 && !storage.bot_builder_token && !has_started_onboarding_tour) {
            setTourSettings(new Date().getTime(), `${tour_type.key}_token`);
        }
        return botStorageSetting;
    };
    if (!bot_tour_token && !is_mobile && !has_started_onboarding_tour) {
        window.addEventListener('storage', botStorageSetting);
    }

    if (localStorage?.dbot_settings !== undefined) {
        storage = JSON.parse(localStorage?.dbot_settings);
    }

    React.useEffect(() => {
        const dbot_settings = JSON.parse(localStorage.getItem('dbot_settings') as string);
        const has_onboard_token_set = active_tab === DASHBOARD && !dbot_settings?.onboard_tour_token;
        const has_bot_builder_token_set = active_tab === BOT_BUILDER && !dbot_settings?.bot_builder_token;
        const show_tour_dialog_desktop = (active_tab === DASHBOARD && !is_mobile) || active_tab === BOT_BUILDER;
        const show_tour_dialog_mobile = active_tab !== DASHBOARD && is_mobile;
        if (has_bot_builder_token_set || has_onboard_token_set) {
            if (is_mobile && has_started_onboarding_tour) {
                setTourActive(true);
                setOnBoardTourRunState(true);
            } else {
                setHasTourEnded(false);
                if (!is_strategy_modal_open) {
                    if (show_tour_dialog_mobile || show_tour_dialog_desktop) {
                        setTourDialogVisibility(true);
                    } else {
                        setTourActive(true);
                        setOnBoardTourRunState(true);
                    }
                }
            }
        }
        if (has_started_bot_builder_tour && active_tab !== BOT_BUILDER && is_mobile) {
            setTourActive(false);
            setBotBuilderTourState(false);
            setTourSettings(new Date().getTime(), `${tour_type.key}_token`);
        }
    }, [active_tab]);

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);
            const el_id = TAB_IDS[tab_index];
            if (el_id) {
                const el_tab = document.getElementById(el_id);
                el_tab?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center',
                });
            }
        },
        [active_tab]
    );

    return (
        <React.Fragment>
            <div className='dashboard__main'>
                <div
                    className={classNames('dashboard__container', {
                        'dashboard__container--active': has_tour_started && active_tab === DASHBOARD && is_mobile,
                    })}
                >
                    {!has_tour_ended && (active_tab === DASHBOARD || active_tab === BOT_BUILDER) ? (
                        <TourStartDialog />
                    ) : (
                        <TourEndDialog />
                    )}

                    {has_tour_started && active_tab === DASHBOARD && (is_mobile ? <MobileTours /> : <DesktopTours />)}
                    <Tabs
                        active_index={active_tab}
                        className='dashboard__tabs'
                        onTabItemChange={onEntered}
                        onTabItemClick={handleTabChange}
                        top
                    >
                        <div icon='IcDashboardComponentTab' label={localize('Dashboard')} id='id-dbot-dashboard'>
                            <DashboardComponent handleTabChange={handleTabChange} />
                        </div>
                        <div icon='IcBotBuilderTabIcon' label={localize('Bot Builder')} id='id-bot-builder' />
                        <div icon='IcChartsTabDbot' label={localize('Charts')} id='id-charts'>
                            <Chart />
                        </div>
                        <div icon='IcTutorialsTabs' label={localize('Tutorials')} id='id-tutorials'>
                            <div className='tutorials-wrapper'>
                                <Tutorial />
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className={'dashboard__run-strategy-wrapper'}>
                    <RunStrategy />
                    {([BOT_BUILDER, CHART].includes(active_tab) || has_started_onboarding_tour) &&
                        !has_started_bot_builder_tour && <RunPanel />}
                </div>
            </DesktopWrapper>
            <MobileWrapper>{!is_strategy_modal_open && <RunPanel />}</MobileWrapper>
            <Dialog
                cancel_button_text={dialog_options.cancel_button_text || localize('Cancel')}
                className={'dc-dialog__wrapper--fixed'}
                confirm_button_text={dialog_options.ok_button_text || localize('OK')}
                has_close_icon
                is_mobile_full_width={false}
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                portal_element_id='modal_root'
                title={dialog_options.title}
            >
                {dialog_options.message}
            </Dialog>
            <StrategyNotification />
        </React.Fragment>
    );
});

export default Dashboard;
