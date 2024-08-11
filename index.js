console.log("Starting Ollama Worker");
const worker = require('./src/worker');

process.on('SIGINT', () => {
    console.log('Received Ctrl+C - shutting down');
    // Perform any cleanup or graceful shutdown logic here
    process.exit(0); // Exit the process to stop the application
  });


async function main(){
    while (true) {
        try{
            
            let request = await worker.processRequest();
            if (request){
                if (request.success){
                    console.log('Successfully processed request.  Earnings: ' + request.tokens);        
                }
                if (request.sleep > 0){
                    await worker.sleep(request.sleep);
                }
            }
            else{                
                await worker.sleep(3000);            
            }
        }
        catch(error){
            console.error('Error processing request:', error);
            // try again in 10 seconds
            await worker.sleep(3000);
        }        
    }
}

// call main function
main().catch(error =>{
    console.error('Error running worker:', error);
    process.exit(1);
})

