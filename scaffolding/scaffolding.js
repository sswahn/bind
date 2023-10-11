const fs = require('fs-extra')
const path = require('path')

const sourceDir = __dirname  // Current directory (where your package is)
const targetDir = process.cwd()  // The user's project directory

// List of directories and files to copy
const itemsToCopy = ['public', 'src', 'index.js']

itemsToCopy.forEach(item => {
  fs.copySync(path.join(sourceDir, item), path.join(targetDir, item))
})

console.log('Devour framework set up complete!')
