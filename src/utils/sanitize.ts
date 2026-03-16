export const sanitizeHTML = (html: string): string => {
  const allowedTags = ['p', 'strong', 'em', 'u', 'br', 'span', 'div', 'ul', 'ol', 'li', 'blockquote']
  const allowedAttrs = ['class', 'style', 'id']

  const div = document.createElement('div')
  div.innerHTML = html

  function sanitizeNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element

      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        element.replaceWith(...Array.from(element.childNodes))
        return
      }

      const attributes = Array.from(element.attributes)
      for (const attr of attributes) {
        if (!allowedAttrs.includes(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name)
        }
      }
    }

    const children = Array.from(node.childNodes)
    for (const child of children) {
      sanitizeNode(child)
    }
  }

  sanitizeNode(div)
  return div.innerHTML
}
