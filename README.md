# FlockOllamaWorker 
A simple worker for flockollamas.com.  This allows your Ollama server to pickup work from [www.Flockollamas.com] and earn llama coin.
## Installation 
1. Create a folder for your worker
    e.g.

   ```mkdir flockollamas-worker```
3. From this folder run:

    ```npm install flockollamas-worker```
2. Once installed run

   ```node node_modules\flockollamas-worker\install.js```
4. Goto www.flockollamas.com and create your free account.  Navigate to the settings page and copy your *public* key into the .env file (optional - if you want to earn the llamas).  

5. either run:  *node run.js* from the install directory, or use your faviourite service controller to keep it alive - e.g. pm2 should install with it


## Running the worker 
You can run with pm2

```pm2 start run.js```

or run directly with node

``` node run.js ```

In order to start accuring llama tokens you will need to update the api key in the .env file.


To use the service just send your requests to https://api.flockollamas.com use this as an alternate to the Ollama server or as the baseURL to openai, pass in your private key in the header as bearer token.

## This is still a work in progress!!!


