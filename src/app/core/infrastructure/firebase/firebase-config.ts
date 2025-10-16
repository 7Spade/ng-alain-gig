/**
 * Firebase 配置檔案
 * 包含所有 Firebase 服務的配置參數
 */

import { environment } from '@env/environment';

export const firebaseConfig = environment['firebase'];

/**
 * Firebase App Check 配置
 * 保護 Firebase 服務免受濫用
 */
export const firebaseAppCheckConfig = {
  // TODO get a reCAPTCHA Enterprise here https://console.cloud.google.com/security/recaptcha?project=_
  provider: '6LeBOusrAAAAAAveKbstwHfHbGKcY1wyvHA10c6s', // 需要實際的 reCAPTCHA Enterprise site key
  isTokenAutoRefreshEnabled: true
};
