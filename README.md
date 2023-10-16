# Bind
Bind is a lightweight JavaScript framework designed for managing state and connecting components to state changes.

## Overview
The framework provides core utilities to:

  · Create a centralized state store  
  · Dispatch actions to update the state  
  · Bind components to state changes and auto-update them  
  · Render DOM elements and components  

## Documentation  

`createStore(initialState)`  

Used to create a new store with the given initial state.

Usage:
```javascript
createStore({
  count: 0,
  user: null
})
```
<br />

`dispatch(action)`  

Dispatches an action to the store.

Usage:
```javascript
dispatch({ type: 'count', payload: 1 })
```
<br />
`bind(type, component)`  

Binds a component to state changes.

Usage:
```javascript
const BoundComponent = bind('count', MyComponent)
```
 <br />
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

## Example
```javascript
// index.js
import { createStore, render } from '@sswahn/bind'
import Main from './Main'

createStore({ counter: 0 })
Main(document.getElementById('root'))
```
```javascript
// Main.js
import { html } from '@sswahn/bind'
import Counter from './Counter'
import DisplayCount from './DisplayCount'

const Main = () => {
  const attributes = {
    id:'main',
    class: 'section'
  }
  const children = [
    Counter()
    DisplayCount()
  ]
  return html('main', attributes, children)
}

export default Main
```
```javascript
// Counter.js
import { html, bind } from '@sswahn/bind'

const Counter = ({ context, dispatch }) => {
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

export default bind('counter', Counter)
```
```javascript
// DisplayCount.js
import { html, bind } from '@sswahn/bind'

const DisplayCount = ({ context }) => {
  return html('span', {
    textContent: context.counter
  })
}

export default bind('counter', DisplayCount)  // Component is bound to state updates
```
