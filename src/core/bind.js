let state = {}
const queue = new Map()
const subscribers = new Map()
const components = new WeakMap()
const parentObservers = new WeakMap()
const parentChildMap = new WeakMap()

// TODO: unit tests

export const createStore = initialState => {
  if (typeof initialState !== 'object' || Array.isArray(initialState)) {
    return console.error('TypeError: createStore argument must be an object literal.')
  }
  state = structuredClone(initialState)
}
  
const dispatch = action => {
  if (typeof action !== 'object' || Array.isArray(action)) {
    return console.error('TypeError: dispatch argument must be an object literal.')
  }
  if (!action.hasOwnProperty('type')) {
    return console.error('Dispatch actions must have a property of "type".')
  }
  if (!action.hasOwnProperty('payload')) {
    return console.error('Dispatch actions must have a property of "payload".')
  }
  if (!Object.keys(state).includes(type)) {
    return console.error(`Dispatched action type ${type} is not found in current state.`)
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
    console.error(`Error processing queue.`)
  }
}

const updateState = (type, payload) => {
  if (typeof payload === 'function') {
    state = {...state, [type]: payload(state[type])}
  } else {
    state = {...state, [type]: payload}
  }
}

const notifySubscribers = type => {
  const subscriber = subscribers.get(type)
  subscriber && subscriber.forEach(item => handleNotification(item, type))
}

const handleNotification = (item, type) => {
  try {
    const { component, parameters } = item
    const liveNode = components.get(component)
    const newElement = component({context: {[type]: deepClone(state[type])}, dispatch, params: parameters})
    liveNode.parentNode.replaceChild(newElement, liveNode)
    components.set(component, newElement)
  } catch (error) {
    console.error(`Error notifying subscribers.`)
  }
}

const continueProcessingQueue = key => {
  if (queue.size > 0) {
    processQueue(key + 1)
  }
}

/* Add to processQueue to perform batch update:
if (queue.size >= 10) {
  return processBatch()
} 
*/
// consider batch dom updates when batch state change occurs //
/*
const processBatch = () => {
  let batch = {}
  
  queue.forEach((update, key) => {
    if (typeof update === 'object' && update !== null) {
      batch = { ...batch, ...structuredClone(update) }
    } else if (typeof update === 'function') {
      batch = { ...batch, [type]: update(state) }
    } else {
      batch = { ...batch, update }
    }
    queue.delete(key)
  })

  state = { ...state, ...batch } // will state always be an object?
} */

const deepClone = value => {
  return typeof value === 'object' && value !== null ? structuredClone(value) : value
}

// TODO: implement third param "cleanup" function
export const bind = (type, component, cleanup = undefined) => {
  if (typeof type !== 'string') {
    return console.error('TypeError: bind function first argument must be a string.')
  }
  if (typeof component !== 'function') {
    return console.error('TypeError: bind function second argument must be a function.')
  }
  if (cleanup !== undefined && typeof cleanup !== 'function') {
    return console.error('TypeError: bind function third argument must be a function.')
  }
  return (...parameters) => {
    const existing = subscribers.get(type) || []
    subscribers.set(type, [...existing, {component, parameters}])
    const element = component({context: {[type]: deepClone(state[type])}, dispatch, params: parameters})
    observe(element, type, component) 
    components.set(component, element)
    return element
  }
}

const unbind = (type, callback) => {
  try {
    const subscription = subscribers.get(type)
    const index = subscription.indexOf(callback)
    const spliced = subscription.toSpliced(index, 1)
    subscribers.set(type, spliced)
  } catch (error) {
    console.error(`Error unbinding component.`)
  }
}

const observe = (element, type, component) => {
  if (!(element instanceof Element)) {
    return console.error('Provided element is not an instance of Element.')
  }
  const parent = element.parentElement
  if (!parent) {
    return console.warn("Trying to observe an element that's not in the DOM.")
  }
  if (!parentChildMap.has(parent)) {
    parentChildMap.set(parent, new WeakMap())
  }
  const childMap = parentChildMap.get(parent)
  if (childMap.has(element)) {
    return console.warn("Already observing this element.")
  }
  childMap.set(element, true)
  if (parentObservers.has(parent)) {
    return
  }
  const observer = new MutationObserver(mutations => {
    const removed = mutations.reduce((acc, mutation) => {
      return [...acc, ...mutation.removedNodes]
    }, [])
    for (let node of removed) {
      if (node instanceof Element && childMap.has(node)) {
        unbind(type, component)
        childMap.delete(node)
      }
    }
    if (childMap.size === 0) { 
      unobserveParent(parent)
    }
  })
  observer.observe(parent, { childList: true })
  parentObservers.set(parent, observer)
}

const unobserveParent = parent => {
  if (parentObservers.has(parent)) {
    parentObservers.get(parent).disconnect()
    parentObservers.delete(parent)
    parentChildMap.delete(parent)
  }
}
