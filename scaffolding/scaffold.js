const fs = require('fs-extra')
const path = require('path')

function scaffoldProject(templateName = 'base') {
    const sourceDir = path.join(__dirname, 'templates', templateName)
    const targetDir = process.cwd()  // Use current directory

    // Check if the template exists
    if (!fs.existsSync(sourceDir)) {
        console.error(`Template "${templateName}" not found.`)
        process.exit(1)
    }

    // Copy template files to the target directory
    fs.copySync(sourceDir, targetDir)

    console.log('Project scaffolded successfully!')
}

// Run the scaffolding
scaffoldProject()
