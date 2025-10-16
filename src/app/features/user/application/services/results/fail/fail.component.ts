import { Component } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-result-fail',
  templateUrl: './fail.component.html',
  imports: [...SHARED_IMPORTS, NzResultModule]
})
export class ProResultFailComponent {}
