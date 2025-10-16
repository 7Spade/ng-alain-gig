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
    apiKey: 'AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI',
    authDomain: 'elite-chiller-455712-c4.firebaseapp.com',
    projectId: 'elite-chiller-455712-c4',
    storageBucket: 'elite-chiller-455712-c4.firebasestorage.app',
    messagingSenderId: '7807661688',
    appId: '1:7807661688:web:29a373231a5fa5ae1d1f8d',
    measurementId: 'G-YZHBTZSY91',
    // App Check 開關 - 正式環境預設啟用以確保安全性
    appCheckEnabled: false
  }
} as Environment;
