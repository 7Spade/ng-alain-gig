import { Environment } from '@delon/theme';

export const environment = {
  production: true,
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
    // App Check 開關 - 正式環境預設啟用以確保安全性
    appCheckEnabled: false
  }
} as Environment;
