import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, getRedirectResult } from '@angular/fire/auth';

@Component({
  selector: 'app-callback',
  template: ``,
  standalone: true
})
export class CallbackComponent implements OnInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.handleRedirect();
  }

  private async handleRedirect(): Promise<void> {
    try {
      // 可從路由帶入 type（如：google、facebook），目前僅用於日後擴充
      const _type = this.route.snapshot.paramMap.get('type') ?? '';
      // 呼叫 Firebase 讀取 redirect 登入結果；onIdTokenChanged 會接手同步 @delon/auth
      await getRedirectResult(this.auth);
    } catch (err) {
      // 可視需要做錯誤提示或導向錯誤頁
      // console.error('Firebase redirect callback error:', err);
    } finally {
      // 完成後導回首頁或前一頁（此處簡化為首頁）
      this.router.navigateByUrl('/');
    }
  }
}
