export type Action = 'launch' | 'shift' | 'nitro' | 'pause';
export class Controls {
  private onKey = (event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLButtonElement && event.code === 'Space')
    )
      return;
    const action: Action | undefined = (
      {
        Space: 'launch',
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
  constructor(
    private handle: (action: Action) => void,
    private enabled: () => boolean,
  ) {
    window.addEventListener('keydown', this.onKey);
  }
  destroy(): void {
    window.removeEventListener('keydown', this.onKey);
  }
}
