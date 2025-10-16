import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared';

@Component({
  selector: 'app-account-settings-notification',
  templateUrl: './notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class ProAccountSettingsNotificationComponent {
  i: {
    password: boolean;
    messages: boolean;
    todo: boolean;
  } = {
    password: true,
    messages: true,
    todo: true
  };
}
