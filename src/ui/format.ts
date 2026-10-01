export const money = (amount: number) => Math.floor(amount).toLocaleString('en-US');
export const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
export const button = (text: string, action: string, id = '', cls = '', disabled = false) =>
  `<button class="${cls}" data-action="${escape(action)}" data-id="${escape(id)}" ${disabled ? 'disabled' : ''}>${text}</button>`;
export const tag = (text: string, cls = '') => `<span class="tag ${cls}">${escape(text)}</span>`;
