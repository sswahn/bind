let state = {}
const queue = new Map()
const subscribers = new Map()
const components = new WeakMap()
const observables = new WeakMap()
const updates = new WeakMap()
const unmounts = new WeakMap()
const handlersRegistry = new Map()
const memoized = new WeakMap()

// consider better error handling system

export const createStore = initialState => {
  if (typeof initialState !== 'object' || Array.isArray(initialState)) {
    throw new TypeError('createStore: argument must be an object literal.')
  }
  state = {...initialState}
}
  
const dispatch = action => { // consider adding middleware
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

// Processes actions stored in queue
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

export const withHooks = (element, fn) => {
  updates.set(element, fn)
  return element
} 

// Right now, you're notifying subscribers for each type individually, 
// which could lead to redundant operations if multiple actions affect the same component.

// Updates a component subscribed to a specific type in state
const handleNotification = (item, type) => {
  try {
    const { component, parameters } = item
    const liveNode = components.get(component)
    const newElement = component({context: {[type]: state[type]}, dispatch, params: parameters})
    if (!newElement) {
      return document.createDocumentFragment()
    }
    if (updates.has(newElement)) {
      const update = updates.get(newElement)
      const unmount = update()
      unmount && umounts.set(newElement, unmount)
    }
    liveNode.parentNode.replaceChild(newElement, liveNode)
    components.set(component, newElement)
  } catch (error) {
    throw new Error(`Error notifying subscribers: ${error}.`)
  }
}

let firstActionTimestamp = null

const continueProcessingQueue = key => {
  const currentTime = Date.now()
  if (!firstActionTimestamp) {
    firstActionTimestamp = currentTime
  }
  const MAX_BATCH_SIZE = 5
  const MAX_WAIT_TIME = 250 // milliseconds
  const size = queue.size
  if (size >= MAX_BATCH_SIZE || currentTime - firstActionTimestamp >= MAX_WAIT_TIME) {
    firstActionTimestamp = null
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
  if (queue.size > 0) {
    processQueue(1)
  }
}

export const memoize = component => {
  return obj => {
    const key = component
    if (memoized.has(key)) {
      return memoized.get(key)
    }
    const element = component(obj)
    memoized.set(key, element)
    return element
  }
}

// Appends and element to the dom and invokes post mount functions
export const render = (element, root) => {
  if (!(element instanceof Element)) {
    throw new TypeError('render: expects first argument to be an instance of Element.')
  }
  if (!(root instanceof Element)) {
    throw new TypeError('render: expects second argument to be an instance of Element.')
  }
  const appended = root.appendChild(element)
  const traverseAndUpdate = node => {
    if (node instanceof Element && updates.has(node)) {
      const update = updates.get(node)
      const unmount = update()
      unmount && umounts.set(node, unmount)
    }
    if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach(child => traverseAndUpdate(child))
    }
  }
  traverseAndUpdate(appended)
  return element
}

// Binds a component to a specific type in state
export const bind = (type, component) => {
  if (typeof type !== 'string') {
    throw new TypeError('bind: function first argument must be a string.')
  }
  if (typeof Component !== 'function') {
    throw new TypeError('bind: second argument must be a function Component.')
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

const nonBubblingEvents = ['change', 'error', 'load', 'mouseenter', 'mouseleave', 'reset', 'scroll', 'unload'] // make extendable

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
    } else if (typeof child === 'string') { // allow Boolean?
      return document.createTextNode(child)
    } else {
      throw new TypeError('html: Expected child elements to be of type Node or string.')
    }
  })
  element.append(...nodes)
  return element
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
  if (!(element instanceof Element) && !(element instanceof DocumentFragment)) {
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
    umounts.delete(node)
    updates.delete(node)
  }
  unbind(type, component)
  removeEventHandlers(node)
  components.delete(component)
  observables.delete(node)
  memoized.delete(component)
}
