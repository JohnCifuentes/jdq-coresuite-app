import { Component } from '@angular/core';
import { AuthRoutingModule } from "../../../features/auth/auth-routing.module";

@Component({
  selector: 'app-sidebar',
  imports: [AuthRoutingModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent {

}
