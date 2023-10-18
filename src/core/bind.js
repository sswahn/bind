let state = {}
const queue = new Map()
const subscribers = new Map()
const components = new WeakMap()
const observables = new WeakMap()

// TODO: unit tests

export const createStore = initialState => {
  console.log('createStore: ', initialState)
  
  if (typeof initialState !== 'object' || Array.isArray(initialState)) {
    return console.error('TypeError: createStore argument must be an object literal.')
  }
  state = structuredClone(initialState)
}
  
const dispatch = action => {
  console.log('dispatch: ', action)
  
  if (typeof action !== 'object' || Array.isArray(action)) {
    return console.error('TypeError: dispatch argument must be an object literal.')
  }
  if (!action.hasOwnProperty('type')) {
    return console.error('Dispatch actions must have a property of "type".')
  }
  if (!action.hasOwnProperty('payload')) {
    return console.error('Dispatch actions must have a property of "payload".')
  }
  if (!Object.keys(state).includes(action.type)) {
    return console.error(`Dispatched action type ${action.type} is not found in current state.`)
  }

  try {
  
  const key = queue.size + 1
  queue.set(key, action)

  if (queue.size === 1) {
    queueMicrotask(() => {
      processQueue(key)
    })
  }

  } catch (error) {
    console.error(`Error dispatching action: ${error}`)
  }
}

const processQueue = key => {
  console.log('processQueue: ', key)
  
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
  console.log('updateState: ', {type, payload})

  try {
    
  if (typeof payload === 'function') {
    state = structuredClone({...state, [type]: payload(state[type])})
  } else {
    state = structuredClone({...state, [type]: payload})
  }
    
  } catch (error) {
    console.error(`Error updating state: ${error}`)
  }
}

const notifySubscribers = type => {
  console.log('notifySubscribers: ', type)
  try {
    const array = subscribers.get(type)
    array?.forEach(item => handleNotification(item, type))
  } catch (error) {
    console.error(`Error notifying subscribers: ${error}.`)
  }
}

const handleNotification = (item, type) => {
  console.log('handleNotification: ', {item, type})
  
  try {
    const { component, parameters } = item
    const liveNode = components.get(component)
    const newElement = component({context: {[type]: deepClone(state[type])}, dispatch, params: parameters})
    liveNode.parentNode.replaceChild(newElement, liveNode)
    components.set(component, newElement)
  } catch (error) {
    console.error(`Error notifying subscribers: ${error}.`)
  }
}

const continueProcessingQueue = key => {
  console.log('continueProcessingQueue: ', key)
  
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
  console.log('deepClone: ', value)
  
  return typeof value === 'object' && value !== null ? structuredClone(value) : value
}

export const bind = (type, component) => {
  console.log('bind: ', {type, component})
  
  if (typeof type !== 'string') {
    return console.error('TypeError: bind function first argument must be a string.')
  }
  if (typeof component !== 'function') {
    return console.error('TypeError: bind function second argument must be a function.')
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

const unbind = (type, component) => {
  console.log('unbind: ', {type, component})
  
  try {
    const subscription = subscribers.get(type)
    const filtered = subscription.filter(item => item.component !== component)
    subscribers.set(type, filtered)
  } catch (error) {
    console.error(`Error unbinding component: ${error}.`)
  }
}

const observe = (element, type, component) => {
  console.log('observe: ', {element, type, component})
  
  if (!(element instanceof Element)) {
    return console.error('Bound components must return instances of Element.')
  }
  if (observables.get(element)) {
    return console.warn('Element already being observed.')
  }
  observables.set(element, true)
  const observer = new MutationObserver(mutations => {
    const removed = mutations.reduce((acc, mutation) => {
      return [...acc, ...mutation.removedNodes]
    }, [])
    for (let node of removed) {
      if (node === element) {

        console.log('observed removal of: ', node)
        
        unbind(type, component)
        observables.delete(element)
        observer.disconnect()
        return console.log('Element unbound, unobserved.')
      }
    }
  })
  observer.observe(document.body, {childList: true, subtree: true})
}
