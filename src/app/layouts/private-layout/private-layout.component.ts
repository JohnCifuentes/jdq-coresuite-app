import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from "./sidebar/sidebar.component";
import { HeaderPrivateComponent } from "./header-private/header-private.component";

@Component({
  selector: 'app-private-layout',
  imports: [CommonModule, SidebarComponent, HeaderPrivateComponent, RouterOutlet],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss'
})

export class PrivateLayoutComponent {
  constructor(private router: Router) {}

  isOperacionRoute(): boolean {
    return this.router.url.startsWith('/app/operacion');
  }

}
