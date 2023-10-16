let state = {}
const queue = new Map()
const subscribers = new Map()
const observables = new WeakMap()

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
    console.error(`Error processing queue: ${error}`)
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
  subscriber && subscriber.forEach(notify => handleNotification(notify, type))
}

const handleNotification = (notify, type) => {
  try {
    notify({ context: {[type]: deepClone(state[type])}, dispatch})
  } catch (error) {
    console.error(`Error notifying subscribers: ${error}`)
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

export const bind = (type, component) => {
  if (typeof type !== 'string') {
    return console.error('TypeError: bind function first argument must be a string.')
  }
  if (typeof component !== 'function') {
    return console.error('TypeError: bind function second argument must be a function.')
  }
  return (...parameters) => {
    const existing = subscribers.get(type) || []
    subscribers.set(type, [...existing, () => component()])
    const element = component({context: {[type]: deepClone(state[type])}, dispatch, params: parameters})
    observe(element, type, component) 
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
    console.error(`Error unsubscribing: ${error}`)
  }
}

/*
Optimization: Each time you call observe, you're setting up a new MutationObserver. 
If you're observing many components within the same parent element, this could become inefficient. 
Consider reusing the same observer for the same parent, and just extending its logic to handle more child elements. 
This, of course, comes with its own complexities and might not be necessary unless you notice performance issues.
*/

const observe = (element, type, component) => {
  if (!element.parentElement) {
    return console.warn("Trying to observe an element that's not in the DOM.")
  }
  const id = crypto.randomUUID()
  observables.set(element, id)

  const observer = new MutationObserver(mutations => {
    const removed = mutations.reduce((acc, mutation) => [...acc, ...mutation.removedNodes], [])
    for (let node of removed) {
      if (node instanceof Element && observables.get(node) === id) {
        unbind(type, component)
        observer.disconnect()
        observables.delete(node)
        break
      }
    }
  })
  
  observer.observe(element.parentElement, { childList: true })
}
