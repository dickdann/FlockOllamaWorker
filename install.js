const fs = require('fs-extra');
const path = require('path');

// sourceDir is 2 dirs up from this file
const sourceDir =  process.cwd();
const targetDir = path.join(__dirname, '..', '..');
console.log(`Running post install step.  TargetDirectory is ${targetDir} sourceDir is ${sourceDir}`);

setTimeout(() => {
    console.log("Copying files...");
    fs.copySync(path.join(sourceDir, '.env.example'), path.join(targetDir, '.env'));
    fs.copySync(path.join(sourceDir, 'run.js'), path.join(targetDir, 'flockollamas-runner.js'));
    console.log("Post install step complete.  To run the worker, execute 'node flockollamas-runner.js'");
    console.log("Alternatively use: pm2 start flockollamas-runner.js --name flockollamas-worker");
}, 3000);

