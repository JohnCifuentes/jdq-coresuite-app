import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { AuthRoutingModule } from "../auth-routing.module";

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, AuthRoutingModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {

}
