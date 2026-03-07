import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthRoutingModule } from "../../../features/auth/auth-routing.module";

@Component({
  selector: 'app-sidebar',
  imports: [AuthRoutingModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent implements OnInit {
  userName = 'Usuario';
  userRole = 'Usuario';
  userInitials = 'US';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const rawUser = localStorage.getItem('auth_user');

    if (!rawUser) {
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      const nameParts = [user.nombre1, user.nombre2, user.apellido1, user.apellido2]
        .filter((part: string) => !!part)
        .map((part: string) => part.trim());

      if (nameParts.length > 0) {
        this.userName = nameParts.join(' ');
      }

      this.userInitials = this.buildInitials(this.userName);
    } catch {
      this.userName = 'Usuario';
      this.userInitials = 'US';
    }
  }

  private buildInitials(fullName: string): string {
    const words = fullName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) {
      return 'US';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

}
