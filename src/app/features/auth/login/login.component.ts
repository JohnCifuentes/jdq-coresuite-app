import { Component } from '@angular/core';
import { AuthRoutingModule } from "../auth-routing.module";

@Component({
  selector: 'app-login',
  imports: [AuthRoutingModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

}
