# Bind
Bind is a lightweight JavaScript framework designed for managing state and connecting components with state changes.

## Overview
The framework provides core utilities to:

Create a centralized state store,
Dispatch actions to update the state,
Bind components to state changes and auto-update them.

## Documentation
### State Management:
`createStore(initialState)`  

Used to create a new store with the given initial state.

Usage:
```javascript
createStore({
  count: 0,
  user: null
})
```
`provider()`  

Provides the current state and dispatch method.

Usage:
```javascript
const { context, dispatch } = provider()

```
`dispatch(action)`  

Dispatches an action to the store.

Usage:
```javascript
dispatch({ type: "increment", payload: 1 })
```
`bind(type, component)`  

Binds a component to state changes.

Usage:
```javascript
const BoundComponent = bind("count", MyComponent)
```
### Component Rendering:
`html(type, attributes, children)`  

A utility function to create DOM elements.

Parameters:
  · type: The type of DOM element to create (e.g., "div", "span").
  · attributes: An object of attributes to apply to the DOM element.
  · children: An array of child nodes or text to append to the created element.
  
Usage:
```javascript
const myDiv = html('div', { class: 'my-class', textContent: 'Hello!' }, [
  html('span', {}, ['Child span'])
])
```
`render(element, root)`  

Renders a given component (or DOM element) into a specified DOM node.

Parameters:
  · element: The DOM element or component to render.
  · root: The root DOM element to append the given element to.
  
Usage:
```javascript
const root = document.getElementById('app')
const myComponent = html('div', {}, ['My Component'])
render(myComponent, root)
```
## Example
```javascript
// App.js
import { createStore, render } from '@sswahn/bind'
import Main from './Main'
createStore({ counter: 0 })
return render(Main(), document.getElementById('root'))
```
```javascript
// Main.js
import { bind, html, render } from '@sswahn/bind'
import Counter from './Counter'
import DisplayCount from './DisplayCount'

const Main = parent => {
  const element = html('div')
  Counter(element)
  DisplayCount(element)
  return render(element, parent)
}

export default Main
```
```javascript
// Counter.js
import { provider, html, render } from '@sswahn/bind'

const Counter = parent => {
  const { context, dispatch } = provider()
  const increment = event => {
    dispatch({ type: 'counter', payload: context.counter + 1 })
  }
  const element = html('button', {
    onClick: increment,
    textContent: '+'
  })
  return render(element, parent)
}

export default Counter
```
```javascript
// DisplayCount.js
import { provider, html, render, bind } from '@sswahn/bind'

const DisplayCount = parent => {
  const { context } = provider()
  const element = html('p', {textContent: context.counter || 0})
  return render(element, parent)
}

export default bind('counter', DisplayCount)  // Component is bound to state updates
```
