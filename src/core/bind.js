let state = {}
const queue = new Map()
const subscribers = new Map()
const components = new WeakMap()
const observables = new WeakMap()

export const createStore = initialState => {
  if (typeof initialState !== 'object' || Array.isArray(initialState)) {
    return console.error('TypeError: createStore argument must be an object literal.')
  }
  state = {...initialState}
}

// provides state to unbound components that only require a single render
export const provider = () => {
  return {context: {...state}, dispatch} 
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
  if (typeof action.payload === 'function') {
    return console.error('TypeError: dispatched action payload cannot be a function.')
  }
  if (!Object.keys(state).includes(action.type)) {
    return console.error(`Dispatched action type ${action.type} is not found in current state.`)
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
    console.error(`Error notifying subscribers: ${error}.`)
  }
}

const handleNotification = (item, type) => {
  try {
    const { component, parameters } = item
    const liveNode = components.get(component)
    const newElement = component({context: {[type]: state[type]}, dispatch, params: parameters})
    liveNode.parentNode.replaceChild(newElement, liveNode)
    components.set(component, newElement)
  } catch (error) {
    console.error(`Error notifying subscribers: ${error}.`)
  }
}

const continueProcessingQueue = key => {
  const size = queue.size
  if (size >= 10) {
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
    subscribers.set(type, [...existing, {component, parameters}])
    const element = component({context: {[type]: state[type]}, dispatch, params: parameters})
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
    console.error(`Error unbinding component: ${error}.`)
  }
}

const observe = (element, type, component) => {
  if (!(element instanceof Element)) {
    return console.error('Bound components must return instances of Element.')
  }
  if (observables.get(element)) {
    return console.warn(`Element already being observed: ${element}`)
  }
  observables.set(element, true)
  const observer = new MutationObserver(mutations => {
    const removed = mutations.map(mutation => mutation.removedNodes).flat()
    for (let node of removed) {
      if (node === element) {
        unbind(type, component)
        observables.delete(element)
        observer.disconnect()
        return console.log(`Node unbound, unobserved: ${node}`)
      }
    }
  })
  observer.observe(document.body, {childList: true, subtree: true})
}
