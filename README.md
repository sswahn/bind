# Bind
Bind is a minimalistic, state-driven UI framework designed for developers who need a reactive web component model without the overhead of larger frameworks. With features such as efficient event delegation, and a centralized state store, Bind bridges the gap between simplicity and functionality, making it ideal for single-page applications and complex web components alike.

## Features

- **Centralized State Management**: Maintain a single source of truth with a well-structured centralized state store.
- **Reactive Components**: Components react automatically to state changes without manual intervention.
- **Efficient Event Delegation**: Utilize event delegation techniques to manage events efficiently without attaching individual event listeners to every element.
- **Declarative UI**: Easily create web components with the `html` utility function, ensuring a clean and descriptive UI design.
- **Easy State Binding**: Use the `bind` function to connect components to specific parts of your state, allowing them to automatically react to changes in that state.
- **Batched State Updates**: Process multiple state updates in batches, optimizing rendering and reducing unnecessary component re-renders.
- **DOM Rendering & Update**: The `render` method allows seamless DOM rendering, and components auto-update in response to state changes.
- **Lifecycle Hooks**: The `withHooks` function gives access to a components lifecycle hooks. Pass an html element and a callback function as arguments.
- **Memoization**: The `memoize` function optimizes performance by caching and reusing computed results.
- **Minimalistic & Lightweight**: Built with performance and simplicity in mind, Bind adds minimal overhead to projects.
- **Mutation Observers**: Keep track of DOM changes efficiently and clean up resources when elements are removed.
- **Event Handlers Cleanup**: Automatically manage and clean up event handlers, preventing memory leaks and ensuring optimal performance.

<!-- TODO: create a functional router. Call the repo @sswahn/switch. -->

## Installation

Using npm:  
```bash  
npm install @sswahn/bind  
```  

## Documentation  
### Importing Bind
To get started, first import the necessary functions from `bind`.  
```javascript
import {createStore, render, bind, html, withHooks, memoize} from '@sswahn/bind'
```  

### Initializing State  
Set up your application's centralized state store using the `createStore` function.
```javascript
createStore({
  count: 0
})
```  

### Accessing State  
In any bound component, you can access the state through the `context` parameter. For instance, to get the value of `count`:
```javascript
const currentCount = context.count
```  

### Modifying State  
To introduce changes to your state, make use of the `dispatch` function available in bound components. This function expects an action object with a `type` and `payload`.
```javascript
dispatch({ type: 'count', payload: 1 })
```  

### Binding Components To State  
Use the `bind` function to create a relationship between your component and a specific state property. When the specified state property changes, your component will automatically update.
```javascript
const BoundComponent = bind('count', MyComponent)
```  

### Render Components  
To attach your application to the DOM, use the `render` function. This function expects the component and a DOM root element as its arguments.
```javascript
render(App(), document.getElementBy('root'))
```  

 ### Building HTML Elements  
Use the `html` utility function to create and return DOM elements. It supports event delegation and can be nested to create complex structures.
```javascript
const attributes = {
  id: 'myDiv',
  class: 'section'
}
const children = [
  html('h1'),
  html('p')
]
const myDiv = html('div', attributes, children)
```

### Lifecycle Hooks 
Call the `withHooks` function when defining your component. Pass the html element and a callback function as arguments.

```javascript
import { html, withHooks } from '@sswahn/bind'

const App = () => {
  const onUpdate = () => {
    console.log('Component has been mounted or rerendered.')
    return () => {
      console.log('Component has unmounted.')
    } 
  }
  const element = html('div')
  return withHooks(element, onUpdate)
}
```  

### Memoization
Use the `memoize` function to optimize performance by caching and reusing computed results, reducing redundant calculations for repeated calls with the same input arguments.
```javascript
const MemoizedComponent = memoize(MyComponent)
const BoundComponent = bind('count', MemoizedComponent)
```  

## Example
This example demonstrates how to build a simple counter application using `bind`. We'll create a centralized state for our counter, bind various components to this state, and show how state changes can lead to UI updates.

### Setting Up the Main App (`index.js`)

Here, we initialize the store and render our main `Counter` component to the DOM.  

```javascript
import { createStore, render } from '@sswahn/bind'
import Counter from './Counter'

createStore({ count: 0 })
render(Counter(), document.getElementById('root'))
```  

### Building the Counter Component (`Counter.js`)
The main component, `Counter`, composes a Button and a Display to provide a user interface for our counter.  

```javascript
import { html } from '@sswahn/bind'
import Button from './Button'
import Display from './Display'

const Counter = () => {
  const attributes = {
    id: 'counter',
    class: 'section'
  }
  const children = [
    Button(),
    Display()
  ]
  return html('div', attributes, children)
}

export default Counter
```

### Creating the Button Component (`Button.js`)
The `Button` component is responsible for incrementing the counter when clicked.  

```javascript
import { html, bind } from '@sswahn/bind'

const Button = ({ context, dispatch }) => {
  const increment = event => {
    dispatch({
      type: 'counter',
      payload: context.count + 1
    })
  }
  return html('button', {
    onClick: increment,
    textContent: '+'
  })
}

export default bind('count', Button)
```

### Creating the Display Component (`Display.js`)
The `Display` component simply shows the current value of our counter.  

```javascript
import { html, bind } from '@sswahn/bind'

const Display = ({ context }) => {
  return html('span', {
    textContent: context.count
  })
}

export default bind('count', Display)
```

## License
Bind is [MIT Licensed](https://github.com/sswahn/bind/blob/main/LICENSE)
