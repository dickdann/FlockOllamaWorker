const worker = require('flockollama-worker');

// call main function
worker.run().catch(error =>{
    console.error('Error running worker:', error);
    process.exit(1);
})
