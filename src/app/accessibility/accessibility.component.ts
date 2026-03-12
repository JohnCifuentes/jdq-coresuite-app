import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from './accessibility.service';

@Component({
    selector: 'app-accessibility',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './accessibility.component.html',
    styleUrl: './accessibility.component.scss'
})
export class AccessibilityComponent {
    isOpen = signal(false);

    constructor(readonly a11y: AccessibilityService) { }

    togglePanel(): void {
        this.isOpen.update(v => !v);
    }

    closePanel(): void {
        this.isOpen.set(false);
    }

    toggleSpeech(): void {
        if (this.a11y.state().speechEnabled) {
            this.a11y.stopSpeech();
        } else {
            this.a11y.speakPage();
        }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.isOpen()) {
            this.closePanel();
        }
    }
}
