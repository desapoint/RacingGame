export type Action = 'shift' | 'nitro' | 'pause';

export class Controls {
  private throttleDown = false;

  private onKeyDown = (event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLButtonElement &&
        event.code === 'Space' &&
        event.target.dataset.action !== 'throttle')
    )
      return;

    if (event.code === 'Space' && this.enabled()) {
      event.preventDefault();
      if (!event.repeat && !this.throttleDown) {
        this.throttleDown = true;
        this.throttle(true);
      }
      return;
    }

    const action: Action | undefined = (
      {
        ArrowUp: 'shift',
        ShiftLeft: 'shift',
        ShiftRight: 'shift',
        KeyN: 'nitro',
        Escape: 'pause',
      } as Record<string, Action>
    )[event.code];
    if (action && this.enabled()) {
      event.preventDefault();
      if (!event.repeat) this.handle(action);
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || !this.throttleDown) return;
    event.preventDefault();
    this.throttleDown = false;
    this.throttle(false);
  };

  private onBlur = () => {
    if (!this.throttleDown) return;
    this.throttleDown = false;
    this.throttle(false);
  };

  constructor(
    private handle: (action: Action) => void,
    private throttle: (active: boolean) => void,
    private enabled: () => boolean,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
