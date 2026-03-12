import { Injectable, signal, effect } from '@angular/core';

export interface AccessibilityState {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  speechEnabled: boolean;
}

const STORAGE_KEY = 'jdq_accessibility';

const DEFAULT_STATE: AccessibilityState = {
  largeText: false,
  highContrast: false,
  reduceMotion: false,
  dyslexiaFont: false,
  speechEnabled: false,
};

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private _state = signal<AccessibilityState>(this.loadState());

  readonly state = this._state.asReadonly();

  constructor() {
    // Sync body classes whenever state changes
    effect(() => {
      this.syncBodyClasses(this._state());
      this.persistState(this._state());
    });
  }

  // ─── Toggles ────────────────────────────────────────────────────────────────

  toggleLargeText(): void {
    this._state.update(s => ({ ...s, largeText: !s.largeText }));
  }

  toggleHighContrast(): void {
    this._state.update(s => ({ ...s, highContrast: !s.highContrast }));
  }

  toggleReduceMotion(): void {
    this._state.update(s => ({ ...s, reduceMotion: !s.reduceMotion }));
  }

  toggleDyslexiaFont(): void {
    this._state.update(s => ({ ...s, dyslexiaFont: !s.dyslexiaFont }));
  }

  // ─── Speech ─────────────────────────────────────────────────────────────────

  speakPage(): void {
    if (!('speechSynthesis' in window)) return;
    this.stopSpeech();

    const main =
      document.querySelector('main') ??
      document.querySelector('#content') ??
      document.querySelector('router-outlet')?.nextElementSibling ??
      document.body;

    const text = (main as HTMLElement).innerText?.trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.onend = () => this._state.update(s => ({ ...s, speechEnabled: false }));
    utterance.onerror = () => this._state.update(s => ({ ...s, speechEnabled: false }));

    this._state.update(s => ({ ...s, speechEnabled: true }));
    window.speechSynthesis.speak(utterance);
  }

  stopSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this._state.update(s => ({ ...s, speechEnabled: false }));
  }

  // ─── Reset ──────────────────────────────────────────────────────────────────

  resetAll(): void {
    this.stopSpeech();
    this._state.set({ ...DEFAULT_STATE });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private syncBodyClasses(state: AccessibilityState): void {
    const body = document.body;
    body.classList.toggle('a11y-large-text', state.largeText);
    body.classList.toggle('a11y-high-contrast', state.highContrast);
    body.classList.toggle('a11y-reduce-motion', state.reduceMotion);
    body.classList.toggle('a11y-dyslexia-font', state.dyslexiaFont);
  }

  private persistState(state: AccessibilityState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  }

  private loadState(): AccessibilityState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_STATE, ...JSON.parse(raw), speechEnabled: false };
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_STATE };
  }
}
