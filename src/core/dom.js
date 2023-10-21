const handlersRegistry = new Map()
const nonBubblingEvents = ['change', 'error', 'load', 'mouseenter', 'mouseleave', 'reset', 'scroll', 'unload']

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
    throw new TypeError('html: Expected first argument to be a string for element type.')
  }
  if (typeof attributes !== 'object' || Array.isArray(attributes)) {
    throw new TypeError('html: Expected second argument to be an object literal for attributes.')
  }
  if (!Array.isArray(children)) {
    throw new TypeError('html: Expected third argument to be an array for children elements.')
  }
  const element = document.createElement(type)
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase()
      const useCapture = nonBubblingEvents.includes(eventType)
      if (!handlersRegistry.has(eventType)) {
        handlersRegistry.set(eventType, new Map())
        document.body.addEventListener(eventType, delegateEventHandling, useCapture)
      }
      handlersRegistry.get(eventType).set(element, value)
    } else if (key === 'textContent') {
      element.textContent = value
    } else if (typeof value !== 'string') {
      throw new TypeError(`html: Expected attribute value to be a string for attribute ${key}. Received type ${typeof value}.`)
    } else {
      element.setAttribute(key, value)
    }
  })
  const nodes = children.map(child => {
    if (child instanceof Node) {
      return child
    } else if (typeof child === 'string') {
      return document.createTextNode(child)
    } else {
      throw new TypeError('html: Expected child elements to be of type Node or string.')
    }
  })
  element.append(...nodes)
  return element
}
