import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderOperacionComponent } from './header-operacion/header-operacion.component';
import { SidebarOperacionComponent } from './sidebar-operacion/sidebar-operacion.component';

@Component({
  selector: 'app-operacion-layout',
  standalone: true,
  imports: [CommonModule, HeaderOperacionComponent, SidebarOperacionComponent, RouterOutlet],
  templateUrl: './operacion-layout.component.html',
  styleUrl: './operacion-layout.component.scss'
})
export class OperacionLayoutComponent {
}
