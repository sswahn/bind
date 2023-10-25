let state = {}
const queue = new Map()
const subscribers = new Map()
const components = new WeakMap()
const mounts = new WeakMap()
const updates = new WeakMap()
const unmounts = new WeakMap()
const observables = new WeakMap()
const handlersRegistry = new Map()

export const createStore = initialState => {
  if (typeof initialState !== 'object' || Array.isArray(initialState)) {
    throw new TypeError('createStore: argument must be an object literal.')
  }
  state = {...initialState}
}
  
const dispatch = action => {
  if (typeof action !== 'object' || Array.isArray(action)) {
    throw new TypeError('dispatch: argument must be an object literal.')
  }
  if (!action.hasOwnProperty('type')) {
    throw new SyntaxError('dispatch: actions must have a property of "type".')
  }
  if (!action.hasOwnProperty('payload')) {
    throw new SyntaxError('dispatch: actions must have a property of "payload".')
  }
  if (typeof action.payload === 'function') {
    throw new TypeError('dispatch: action payload cannot be a function.')
  }
  if (!state.hasOwnProperty(action.type)) {
    throw new ReferenceError(`dispatch: action type ${action.type} is not found in current state.`)
  }
  const key = queue.size + 1
  queue.set(key, action)
  if (queue.size === 1) {
    queueMicrotask(() => {
      processQueue(key)
    })
  }
}

const processQueue = key => {
  try {
    const {type, payload} = queue.get(key)
    updateState(type, payload)
    notifySubscribers(type)
    queue.delete(key)
    continueProcessingQueue(key)
  } catch (error) {
    console.error(`Error processing queue: ${error}.`)
  }
}

const updateState = (type, payload) => {
  state = {...state, [type]: payload}
}

const notifySubscribers = type => {
  try {
    const array = subscribers.get(type)
    array?.forEach(item => handleNotification(item, type))
  } catch (error) {
    throw new Error(`Error notifying subscribers: ${error}.`)
  }
}

export const render = (element, root) => {
  if (!(element instanceof Element)) {
    throw new TypeError('render: expects first argument to be an instance of Element.')
  }
  if (!(root instanceof Element)) {
    throw new TypeError('render: expects second argument to be an instance of Element.')
  }
  root.appendChild(element)
  element.children.forEach(child => {
    if (mounts.has(child)) {
      const mount = mounts.get(child)
      mount()
    }
  })
  return element
}

export const hooks = (element, hook) => {
  if (!(element instanceof Element)) {
    throw new TypeError('hooks: expects first argument to be an instance of Element.')
  }
  if (typeof hook !== 'object' || Array.isArray(hook)) {
    throw new TypeError('hooks: second argument must be an object literal.')
  }
  if (!hook.hasOwnProperty('mount') && !hook.hasOwnProperty('update') && !hook.hasOwnProperty('unmount')) {
    throw new Error('hooks: At least one of the properties (mount, update, unmount) should be provided.')
  }
  if (!Object.values(hook).every(value => typeof value === 'function')) {
    throw new TypeError('hooks: expects second argument property values to be a of type function')
  }
  if (hook.mount) {
    mounts.set(element, hook.mount)
  }
  if (hook.update) {
    updates.set(element, hook.update)
  }
  if (hook.unmount) {
    unmounts.set(element, hook.unmount)
  }
}

const handleNotification = (item, type) => {
  try {
    const { component, parameters } = item
    const liveNode = components.get(component)
    const newElement = component({context: {[type]: state[type]}, dispatch, params: parameters})
    if (!newElement) {
      return document.createDocumentFragment()
    }
    liveNode.parentNode.replaceChild(newElement, liveNode)
    if (updates.has(newElement)) {
      const update = updates.get(newElement)
      update()
    }
    components.set(component, newElement)
  } catch (error) {
    throw new Error(`Error notifying subscribers: ${error}.`)
  }
}

const continueProcessingQueue = key => {
  const size = queue.size
  if (size >= 5) {
    return processBatch()
  } 
  if (size > 0) {
    processQueue(key + 1)
  }
}

const processBatch = () => {
  let batch = {}
  queue.forEach((action, key) => {
    batch[action.type] = action.payload
    queue.delete(key)
  })
  state = {...state, ...batch}
  Object.keys(batch).forEach(type => {
    notifySubscribers(type)
  })
}

export const bind = (type, component) => {
  if (typeof type !== 'string') {
    throw new TypeError('bind: function first argument must be a string.')
  }
  if (typeof component !== 'function') {
    throw new TypeError('bind: function second argument must be a function.')
  }
  return (...parameters) => {
    const existing = subscribers.get(type) || []
    subscribers.set(type, [...existing, {component, parameters}])
    const element = component({context: {[type]: state[type]}, dispatch, params: parameters})
    if (!element) {
      return document.createDocumentFragment()
    }
    observe(element, type, component)
    components.set(component, element)
    return element
  }
}

const unbind = (type, component) => {
  try {
    const subscription = subscribers.get(type)
    const filtered = subscription.filter(item => item.component !== component)
    subscribers.set(type, filtered)
  } catch (error) {
    throw new Error(`Error unbinding component: ${error}.`)
  }
}

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

const nonBubblingEvents = ['change', 'error', 'load', 'mouseenter', 'mouseleave', 'reset', 'scroll', 'unload']

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
    if (!child || child === false) {
      return document.createDocumentFragment()
    } else if (child instanceof Node) {
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

const removeEventHandlers = element => {
  for (const [eventType, elements] of handlersRegistry.entries()) {
    if (elements.has(element)) {
      elements.delete(element)
      if (elements.size === 0) {
        document.body.removeEventListener(eventType, delegateEventHandling)
        handlersRegistry.delete(eventType)
      }
    }
  }
}

const observe = (element, type, component) => {
  if (!(element instanceof Element) || !(element instanceof DocumentFragment)) {
    throw new TypeError('Bound components must return instances of Element or DocumentFragment.')
  }
  if (observables.get(element)) {
    return
  }
  const observer = new MutationObserver(mutations => {
    const removed = mutations.map(mutation => mutation.removedNodes).flat()
    for (let node of removed) {
      if (node === element) {
        cleanup(type, component, node)
        observer.disconnect()
        return
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  observables.set(element, true)
  const nodesToObserve = element instanceof DocumentFragment ? Array.from(element.childNodes) : [element]
  nodesToObserve.forEach(node => {
    if (!observables.get(node)) {
      observables.set(node, true)
      if (node.childNodes && node.childNodes.length) {
        observe(node, type, component)
      }
    }
  })
}

const cleanup = (type, component, node) => {
  if (unmounts.has(node)) {
    const unmount = unmounts.get(node)
    unmount()
  }
  unbind(type, component)
  removeEventHandlers(node)
  components.delete(component)
  mounts.delete(node)
  updates.delete(node)
  unmounts.delete(node)
  observables.delete(node)
}
