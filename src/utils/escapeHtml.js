// HTML escaping utility for preventing XSS attacks in chat/messages.
// React escapes by default when rendering text nodes, but this adds
// explicit defense-in-depth when we ever use `dangerouslySetInnerHTML`
// or when data might be interpolated into raw HTML.

/**
 * Escape HTML special characters to prevent XSS attacks.
 * @param {string | null | undefined} text - Text to escape
 * @returns {string} Escaped text safe for rendering
 */
export function escapeHtml(text) {
  if (!text) return "";

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return String(text).replace(/[&<>"']/g, (char) => map[char] || char);
}


