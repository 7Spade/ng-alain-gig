/**
 * Firebase Providers 配置
 * 包含所有 Firebase 服務的 providers 配置
 */

import { Provider, EnvironmentProviders } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth as provideAuth_alias } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, provideAppCheck } from '@angular/fire/app-check';
import { getApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';

import { getFirebaseConfig, getFirebaseAppCheckConfig } from './firebase-config';

/**
 * Firebase 所有服務的 Providers 配置
 * 保持與原始 app.config.ts 完全相同的順序和配置
 */
export const firebaseProviders: Array<Provider | EnvironmentProviders> = [
  // 1. Firebase 應用程式初始化
  provideFirebaseApp(() => {
    const config = getFirebaseConfig(); // 🚨 延遲載入配置
    return initializeApp({
      projectId: config.projectId,
      appId: config.appId,
      storageBucket: config.storageBucket,
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      messagingSenderId: config.messagingSenderId,
      measurementId: config.measurementId
    });
  }),

  // 2. Firebase 認證
  provideAuth_alias(() => getAuth()),

  // 3. Firebase 分析
  provideAnalytics(() => getAnalytics()),
  ScreenTrackingService,
  UserTrackingService,

  // 4. Firebase App Check (安全驗證) - 絕對保護
  provideAppCheck(() => {
    const appCheckConfig = getFirebaseAppCheckConfig(); // 🚨 延遲載入配置
    const provider = new ReCaptchaEnterpriseProvider(appCheckConfig.provider);
    return initializeAppCheck(getApp(), {
      provider,
      isTokenAutoRefreshEnabled: appCheckConfig.isTokenAutoRefreshEnabled
    });
  }),

  // 5. Firebase Firestore (資料庫)
  provideFirestore(() => getFirestore()),

  // 6. Firebase Functions (雲端函數)
  provideFunctions(() => getFunctions()),

  // 7. Firebase Messaging (推播通知)
  provideMessaging(() => getMessaging()),

  // 8. Firebase Performance (效能監控)
  providePerformance(() => getPerformance()),

  // 9. Firebase Storage (檔案儲存)
  provideStorage(() => getStorage()),

  // 10. Firebase Remote Config (遠端配置)
  provideRemoteConfig(() => getRemoteConfig())
];
