/**
 * Firebase 配置檔案
 * 包含所有 Firebase 服務的配置參數
 *
 * 🚨 修復：使用函式延遲載入，避免模組載入時的 undefined 問題
 */

import { environment } from '@env/environment';

/**
 * 延遲載入 Firebase 配置
 * 確保在使用時 environment 已經正確初始化
 */
export function getFirebaseConfig() {
  const config = environment?.['firebase'];
  if (!config) {
    throw new Error(
      `Firebase configuration is missing in environment. ` + `Please check environment.${environment?.production ? 'prod.' : ''}ts file.`
    );
  }
  return config;
}

/**
 * Firebase App Check 配置
 * 保護 Firebase 服務免受濫用
 */
export function getFirebaseAppCheckConfig() {
  const config = environment?.['firebase'];

  // 檢查 App Check 是否啟用
  if (!config?.appCheckEnabled) {
    console.warn('Firebase App Check is disabled in environment configuration');
    return null;
  }

  return {
    provider: '6LeGl-wrAAAAALTgTmQN5XbGLB2hVKhcySGyBIXI',
    isTokenAutoRefreshEnabled: true
  };
}
