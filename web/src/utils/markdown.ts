export function stripMarkdown(markdown: string): string {
  return (
    markdown
      // Remove fenced code blocks (keep content).
      .replace(/```[\s\S]*?\n([\s\S]*?)```/g, "$1")
      // Remove inline code backticks.
      .replace(/`([^`]*)`/g, "$1")
      // Remove bold and italic markers.
      .replace(/\*\*([^*]*)\*\*/g, "$1")
      .replace(/__([^_]*)__/g, "$1")
      .replace(/\*([^*]*)\*/g, "$1")
      .replace(/_([^_]*)_/g, "$1")
      // Remove headings markers.
      .replace(/^#{1,6}\s+/gm, "")
      // Remove link/image markup, keep text/alt.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Remove list markers.
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // Trim surrounding whitespace.
      .trim()
  );
}
