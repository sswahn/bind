# Bind
Bind is a lightweight JavaScript framework designed for managing state and connecting components with state changes.

## Overview
The framework provides core utilities to:

Create a centralized state store
Dispatch actions to update the state
Bind components to state changes and auto-update them
Observe and unbind components from state changes

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
