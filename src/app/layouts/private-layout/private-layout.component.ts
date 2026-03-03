import { Component } from '@angular/core';
import { SidebarComponent } from "./sidebar/sidebar.component";
import { HeaderPrivateComponent } from "./header-private/header-private.component";
import { AuthRoutingModule } from "../../features/auth/auth-routing.module";

@Component({
  selector: 'app-private-layout',
  imports: [SidebarComponent, HeaderPrivateComponent, AuthRoutingModule],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss'
})

export class PrivateLayoutComponent {

}
