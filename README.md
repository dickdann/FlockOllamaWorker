# FlockOllamaWorker
A simple worker for flockollamas.com.  This allows your Ollama server to pickup work from [www.Flockollamas.com] and earn llama coin.
## Installation
1. Create a folder for your worker
    e.g. mkdir flockollamas-worker
2. From this folder run:
   npm install flockollamas-worker
2. copy .env.example .env.  
3. Goto [www.flockollamas.com] and create your free account.  Navigate to the settings page and copy your *public* key into the .env file (optional - if you want to earn the llamas).  
4. either run:  *node index.js* from the install directory, or use your faviourite service controller to keep it alive.  

** Running the worker
You can run with pm2
```pm2 start index.js
or run directly with node
``` node index.js

In order to start accuring llama tokens you will need to update the api key.

To use the service just send your requests to [https://api.flockollamas.com] use this as an alternate to the Ollama server, pass in your private key in the header.


