import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-contrails',
    version: '0.1.0',
    icon: '🛫',
    title: 'Contrail finder',
    description: 'This app helps the user discover the right conditions for contrail formation',
    author: 'Ioana Logafatu',
    repository: 'https://github.com/IoanaLogafatu/windy-plugin-contrails',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/contrails',
    listenToSingleclick: true,
};

export default config;
