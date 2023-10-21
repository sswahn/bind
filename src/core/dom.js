const handlersRegistry = new Map()

const delegateEventHandling = event => {
  const target = event.target
  const eventHandlers = handlersRegistry.get(event.type)
  if (eventHandlers) {
    for (const [elem, handler] of eventHandlers.entries()) {
      if (target === elem || elem.contains(target)) {
        handler(event)
      }
    }
  }
}

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
      const eventType = key.slice(2).toLowerCase()
      if (!handlersRegistry.has(eventType)) {
        handlersRegistry.set(eventType, new Map())
        document.body.addEventListener(eventType, delegateEventHandling)
      }
      handlersRegistry.get(eventType).set(element, value)
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
