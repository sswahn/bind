import { html } from '../src/core/dom.js'

describe('html function', () => {
  
  test('it should create a valid HTML element', () => {
    const element = html('div', { id: 'test' }, ['Hello'])
    expect(element.tagName).toBe('DIV')
    expect(element.id).toBe('test')
    expect(element.textContent).toBe('Hello')
  })

  test('it should handle events correctly', () => {
    let clicked = false
    const handleClick = () => clicked = true
    const button = html('button', { onClick: handleClick }, ['Click Me'])
    button.click()
    expect(clicked).toBe(true)
  })

  test('it should handle textContent attribute', () => {
    const element = html('span', { textContent: 'Hello, World!' }, [])
    expect(element.textContent).toBe('Hello, World!')
  })

  test('it should handle child nodes', () => {
    const child = document.createElement('span')
    child.textContent = 'Child'
    const element = html('div', {}, ['Hello', child])
    expect(element.childNodes.length).toBe(2)
    expect(element.childNodes[1].textContent).toBe('Child')
  })

  test('it should error if first argument is not a string', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    html(123, {}, [])
    expect(consoleSpy).toHaveBeenCalledWith('TypeError: html first argument must be a string.')
    consoleSpy.mockRestore()
  })

  test('it should error if second argument is not an object literal', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    html('div', [], [])
    expect(consoleSpy).toHaveBeenCalledWith('TypeError: html second argument must be an object literal.')
    consoleSpy.mockRestore()
  })

  test('it should error if third argument is not an array', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    html('div', {}, 'Hello')
    expect(consoleSpy).toHaveBeenCalledWith('TypeError: html third argument must be an array.')
    consoleSpy.mockRestore()
  })

  test('it should set attributes and properties correctly', () => {
    const dummyFunc = () => {}
    const element = html('div', { class: 'test', onclick: dummyFunc }, [])
    expect(element.className).toBe('test') // This is a property
    expect(element.onclick).toBe(dummyFunc) // This is also a property
    expect(element.getAttribute('class')).toBe('test') // This is an attribute
  })

  test('it should convert non-Node children to text nodes', () => {
    const element = html('div', {}, [123, true])
    expect(element.childNodes.length).toBe(2)
    expect(element.childNodes[0].nodeType).toBe(Node.TEXT_NODE)
    expect(element.childNodes[0].textContent).toBe('123')
    expect(element.childNodes[1].nodeType).toBe(Node.TEXT_NODE)
    expect(element.childNodes[1].textContent).toBe('true')
  })

  test('it should handle complex attributes correctly', () => {
    const element = html('div', { 
      'data-test': 'testdata',
      'disabled': true
    }, [])
    expect(element.getAttribute('data-test')).toBe('testdata')
    expect(element.hasAttribute('disabled')).toBe(true)
  })

  test('it should handle deeply nested children', () => {
    const deepChild = html('span', {}, ['Deep Child'])
    const child = html('div', {}, ['Child', deepChild])
    const element = html('div', {}, ['Root', child])
    expect(element.childNodes.length).toBe(2)
    expect(element.childNodes[1].childNodes[1]).toBe(deepChild)
  })
})
