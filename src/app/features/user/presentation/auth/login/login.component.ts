import { HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StartupService } from '@core';
import { ReuseTabService } from '@delon/abc/reuse-tab';
import { ALLOW_ANONYMOUS, DA_SERVICE_TOKEN } from '@delon/auth';
import { I18nPipe, SettingsService, _HttpClient } from '@delon/theme';
import { Auth, GoogleAuthProvider, signInWithRedirect } from '@angular/fire/auth';
import { environment } from '@env/environment';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { finalize } from 'rxjs';

@Component({
  selector: 'passport-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    I18nPipe,
    NzCheckboxModule,
    NzTabsModule,
    NzAlertModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzToolTipModule,
    NzIconModule
  ]
})
export class UserLoginComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly reuseTabService = inject(ReuseTabService, { optional: true });
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly startupSrv = inject(StartupService);
  private readonly http = inject(_HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(Auth);

  form = inject(FormBuilder).nonNullable.group({
    userName: ['', [Validators.required, Validators.pattern(/^(admin|user)$/)]],
    password: ['', [Validators.required, Validators.pattern(/^(ng-alain\.com)$/)]],
    mobile: ['', [Validators.required, Validators.pattern(/^1\d{10}$/)]],
    captcha: ['', [Validators.required]],
    remember: [true]
  });
  error = '';
  type = 0;
  loading = false;

  count = 0;
  interval$: any;

  switch({ index }: NzTabChangeEvent): void {
    this.type = index!;
  }

  getCaptcha(): void {
    const mobile = this.form.controls.mobile;
    if (mobile.invalid) {
      mobile.markAsDirty({ onlySelf: true });
      mobile.updateValueAndValidity({ onlySelf: true });
      return;
    }
    this.count = 59;
    this.interval$ = setInterval(() => {
      this.count -= 1;
      if (this.count <= 0) {
        clearInterval(this.interval$);
      }
    }, 1000);
  }

  submit(): void {
    this.error = '';
    if (this.type === 0) {
      const { userName, password } = this.form.controls;
      userName.markAsDirty();
      userName.updateValueAndValidity();
      password.markAsDirty();
      password.updateValueAndValidity();
      if (userName.invalid || password.invalid) {
        return;
      }
    } else {
      const { mobile, captcha } = this.form.controls;
      mobile.markAsDirty();
      mobile.updateValueAndValidity();
      captcha.markAsDirty();
      captcha.updateValueAndValidity();
      if (mobile.invalid || captcha.invalid) {
        return;
      }
    }

    // 默认配置中对所有HTTP请求都会强制 [校验](https://ng-alain.com/auth/getting-started) 用户 Token
    // 然一般来说登录请求不需要校验，因此加上 `ALLOW_ANONYMOUS` 表示不触发用户 Token 校验
    this.loading = true;
    this.cdr.detectChanges();
    this.http
      .post(
        '/login/account',
        {
          type: this.type,
          userName: this.form.value.userName,
          password: this.form.value.password
        },
        null,
        {
          context: new HttpContext().set(ALLOW_ANONYMOUS, true)
        }
      )
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(res => {
        if (res.msg !== 'ok') {
          this.error = res.msg;
          this.cdr.detectChanges();
          return;
        }
        // 清空路由复用信息
        this.reuseTabService?.clear();
        // 设置用户Token信息
        // TODO: Mock expired value
        res.user.expired = +new Date() + 1000 * 60 * 5;
        this.tokenService.set(res.user);
        // 重新获取 StartupService 内容，我们始终认为应用信息一般都会受当前用户授权范围而影响
        this.startupSrv.load().subscribe(() => {
          let url = this.tokenService.referrer!.url || '/';
          if (url.includes('/passport')) {
            url = '/';
          }
          this.router.navigateByUrl(url);
        });
      });
  }

  openGoogle(): void {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(this.auth, provider);
  }

  ngOnDestroy(): void {
    if (this.interval$) {
      clearInterval(this.interval$);
    }
  }
}
