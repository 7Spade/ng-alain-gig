// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import * as MOCKDATA from '@_mock';
import { mockInterceptor, provideMockConfig } from '@delon/mock';
import { Environment } from '@delon/theme';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  firebase: {
    projectId: 'elite-chiller-455712-c4',
    appId: '1:7807661688:web:4bd4d17427e092281d1f8d',
    storageBucket: 'elite-chiller-455712-c4.firebasestorage.app',
    apiKey: 'AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI',
    authDomain: 'elite-chiller-455712-c4.firebaseapp.com',
    messagingSenderId: '7807661688',
    measurementId: 'G-VFCBRLWEQF',
    projectNumber: '7807661688',
    version: '2',
    // App Check 開關 - 開發環境預設停用以避免 403 錯誤
    appCheckEnabled: false
  },
  providers: [provideMockConfig({ data: MOCKDATA })],
  interceptorFns: [mockInterceptor]
} as Environment;
