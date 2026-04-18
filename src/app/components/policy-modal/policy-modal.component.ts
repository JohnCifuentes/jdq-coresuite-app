import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-policy-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy-modal.component.html',
  styleUrl: './policy-modal.component.scss'
})
export class PolicyModalComponent {
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
