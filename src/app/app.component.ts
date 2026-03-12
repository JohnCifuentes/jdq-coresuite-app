import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccessibilityComponent } from './accessibility/accessibility.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AccessibilityComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'jdq-coresuite-app';
}
