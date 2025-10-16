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
    apiKey: 'AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI',
    authDomain: 'elite-chiller-455712-c4.firebaseapp.com',
    projectId: 'elite-chiller-455712-c4',
    storageBucket: 'elite-chiller-455712-c4.firebasestorage.app',
    messagingSenderId: '7807661688',
    appId: '1:7807661688:web:29a373231a5fa5ae1d1f8d',
    measurementId: 'G-YZHBTZSY91',
    // App Check 開關 - 開發環境預設停用以避免 403 錯誤
    appCheckEnabled: false
  },
  providers: [provideMockConfig({ data: MOCKDATA })],
  interceptorFns: [mockInterceptor]
} as Environment;
