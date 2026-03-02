import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "../public-layout/footer/footer.component";
import { HeaderComponent } from "../public-layout/header/header.component";

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterOutlet,
    FooterComponent, 
    HeaderComponent
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent {
}
