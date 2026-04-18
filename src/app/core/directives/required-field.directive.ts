import { Directive, ElementRef, Input, OnInit, Renderer2, inject } from '@angular/core';
import { AbstractControl, ControlContainer, Validators } from '@angular/forms';

@Directive({
  selector: 'label, [appRequiredField]',
  standalone: true
})
export class RequiredFieldDirective implements OnInit {
  @Input('appRequiredField') controlNameInput?: string;

  private readonly labelEl = inject(ElementRef<HTMLLabelElement>);
  private readonly renderer = inject(Renderer2);
  private readonly controlContainer = inject(ControlContainer, { optional: true });

  ngOnInit(): void {
    const controlName = this.resolveControlName();
    if (!controlName) {
      return;
    }

    const control = this.controlContainer?.control?.get(controlName);
    if (!control || !this.isRequired(control)) {
      return;
    }

    if (!this.labelEl.nativeElement.querySelector('.required-asterisk') && !this.labelEl.nativeElement.textContent?.includes('*')) {
      const asterisk = this.renderer.createElement('span');
      this.renderer.addClass(asterisk, 'required-asterisk');
      this.renderer.setAttribute(asterisk, 'aria-hidden', 'true');
      this.renderer.appendChild(asterisk, this.renderer.createText(' *'));
      this.renderer.appendChild(this.labelEl.nativeElement, asterisk);
    }

    this.setAriaRequired(controlName);
  }

  private resolveControlName(): string | null {
    if (this.controlNameInput) {
      return this.controlNameInput;
    }

    const htmlFor = this.labelEl.nativeElement.getAttribute('for');
    if (htmlFor) {
      const byFor = document.getElementById(htmlFor);
      const controlNameByFor = byFor?.getAttribute('formControlName');
      if (controlNameByFor) {
        return controlNameByFor;
      }
    }

    const host = this.labelEl.nativeElement;
    const parent = host.parentElement;
    const byParent = parent?.querySelector('[formControlName]');
    return byParent?.getAttribute('formControlName') ?? null;
  }

  private isRequired(control: AbstractControl): boolean {
    if (control.hasValidator?.(Validators.required)) {
      return true;
    }

    const validatorResult = control.validator?.({} as AbstractControl);
    return !!validatorResult?.['required'];
  }

  private setAriaRequired(controlName: string): void {
    const host = this.labelEl.nativeElement;
    const parent = host.parentElement;
    const controlEl = parent?.querySelector(`[formControlName="${controlName}"]`) as HTMLElement | null;

    if (controlEl && !controlEl.hasAttribute('aria-required')) {
      this.renderer.setAttribute(controlEl, 'aria-required', 'true');
    }
  }
}
