import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Plan } from './payment.models';

@Component({
  selector: 'app-plan-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-selector.component.html',
  styleUrl: './plan-selector.component.scss'
})
export class PlanSelectorComponent {
  @Input() plans: Plan[] = [];
  @Input() currentPlanId: number | null = null;
  @Input() selectedPlanId: number | null = null;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() planSelected = new EventEmitter<number>();
  @Output() changeRequested = new EventEmitter<void>();

  get currentPlan(): Plan | undefined {
    return this.plans.find((plan) => plan.id === this.currentPlanId);
  }

  get selectedPlan(): Plan | undefined {
    return this.plans.find((plan) => plan.id === this.selectedPlanId);
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value ?? 0));
  }

  onSelectionChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isFinite(value) && value > 0) {
      this.planSelected.emit(value);
    }
  }
}
