export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error("剪贴板 API 不可用");
  }

  await navigator.clipboard.writeText(text);
}
