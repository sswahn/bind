# Bind
Bind is a lightweight JavaScript framework designed for managing state and connecting components to state changes.

## Overview
The framework provides core utilities to:

  · Create a centralized state store  
  · Dispatch actions to update the state  
  · Bind components to state changes and auto-update them  
  · Render DOM elements and components  

## Documentation  
### Create State
`createStore(initialState)`  

Used to create a new store with the given initial state.

Usage:
```javascript
createStore({
  count: 0,
  user: null
})
```

### Get State
`context`  

Provides a copy of the current bound state.

Usage:
```javascript
context.count
```

### Update State
`dispatch(action)`  

Dispatches an action to the store.

Usage:
```javascript
dispatch({ type: 'count', payload: 1 })
```

### Bind A Component To State
`bind(type, component)`  

Binds a component to state changes.

Usage:
```javascript
const BoundComponent = bind('count', MyComponent)
```
### Access State From Provider
`provider()`  

Provides a unbound component access to state.  

Usage:
```javascript
const { context, dispatch } = provider('count')
```

 ### Create An HTML Element
`html(type, attributes, children)`  

A utility function to create DOM elements.

Parameters:  
  · **type**: The type of DOM element to create (e.g., "div", "span").  
  · **attributes**: An object of attributes to apply to the DOM element.  
  · **children**: An array of child nodes or text to append to the created element.  
  
Usage:
```javascript
const myDiv = html('div', { class: 'my-class', textContent: 'Hello!' }, [
  html('span', {}, ['Child span'])
])
```

## Example
```javascript
// index.js
import { createStore } from '@sswahn/bind'
import Counter from './Counter'

createStore({ counter: 0 })
document.getElementById('root').appendChild(Counter())
```
```javascript
// Counter.js
import { html } from '@sswahn/bind'
import Button from './Button'
import Display from './Display'

const Counter = () => {
  const attributes = {
    id: 'counter',
    class: 'section'
  }
  const children = [
    Button()
    Display()
  ]
  return html('div', attributes, children)
}

export default Counter
```
```javascript
// Button.js
import { html, bind } from '@sswahn/bind'

const Button = ({ context, dispatch }) => {
  const increment = event => {
    dispatch({
      type: 'counter',
      payload: context.counter + 1
    })
  }
  return html('button', {
    onClick: increment,
    textContent: '+'
  })
}

export default bind('counter', Button)
```
```javascript
// Display.js
import { html, bind } from '@sswahn/bind'

const Display = ({ context }) => {
  return html('span', {
    textContent: context.counter
  })
}

export default bind('counter', Display)
```
## Licence
Bind is [MIT Licensed](https://github.com/sswahn/bind/blob/main/LICENSE)
