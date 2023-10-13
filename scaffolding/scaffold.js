const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const scriptDirectory = __dirname;
const projectDirectory = process.cwd();

const sourceDir = path.join(scriptDirectory, 'templates', 'base'); 
const targetDir = projectDirectory;

// Copy template files to the target directory
fs.copySync(sourceDir, targetDir);

// Rename package.json.template to package.json
const packageTemplatePath = path.join(targetDir, 'package.json.template');
const packagePath = path.join(targetDir, 'package.json');

if (fs.existsSync(packageTemplatePath)) {
    fs.renameSync(packageTemplatePath, packagePath);
}

// Install dependencies
execSync('npm install', {
  cwd: targetDir,
  stdio: 'inherit'
});

console.log('Project scaffolded and dependencies installed successfully!');
