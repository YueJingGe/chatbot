export function checkIsAtBottom(element: HTMLElement) {
  const threshold = 30;
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}
