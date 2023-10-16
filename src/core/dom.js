export const html = (type, attributes = {}, children = []) => {
  if (typeof type !== 'string') {
    return console.error('TypeError: html first argument must be a string.')
  }
  if (typeof attributes !== 'object' || Array.isArray(attributes)) {
    return console.error('TypeError: html second argument must be an object literal.')
  }
  if (!Array.isArray(children)) {
    return console.error('TypeError: html third argument must be an array.')
  }
  const element = document.createElement(type)
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      element[key.toLowerCase()] = value
    } else if (key === 'textContent') {
      element.textContent = value
    } else {
      element.setAttribute(key, value)
    }
  })
  const nodes = children.map(child => 
    child instanceof Node ? child : document.createTextNode(child)
  )
  element.append(...nodes)
  return element
}
