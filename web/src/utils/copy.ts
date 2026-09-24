export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error("剪贴板 API 不可用");
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    copyWithExecCommand(text);
  }
}

function copyWithExecCommand(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (selected && selection) {
    selection.removeAllRanges();
    selection.addRange(selected);
  }

  if (!success) {
    throw new Error("复制失败");
  }
}
// temporary fix comment
