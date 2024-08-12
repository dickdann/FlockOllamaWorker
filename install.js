const fs = require('fs-extra');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'flockollama-worker');
const targetDir = process.cwd();
console.log("Running post install step");
fs.copySync(path.join(sourceDir, '.env.example'), path.join(targetDir, '.env'));
fs.copySync(path.join(sourceDir, 'run.js'), path.join(targetDir, 'flockollama-runner.js'));

console.log("Post install step complete.  To run the worker, execute 'node flockollama-runner.js'");
console.log("Alternatively use: pm2 start flockollama-runner.js --name flockollama-worker");