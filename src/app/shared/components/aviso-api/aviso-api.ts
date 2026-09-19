import { Component, input } from '@angular/core';

@Component({
  selector: 'app-aviso-api',
  imports: [],
  templateUrl: './aviso-api.html',
  styleUrl: './aviso-api.css',
})
export class AvisoApi {
  readonly mensaje = input.required<string>();
}
