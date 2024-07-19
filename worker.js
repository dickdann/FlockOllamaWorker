const axios = require('axios');
const http = require('http');
const mcache = require('memory-cache');
require('dotenv').config();

async function getOllamaModels(){
    const ollamaUrl = process.env.OLLAMA_URL;
    let models = mcache.get('models');

    if (!models) {    
        try {
            const response = await axios.get(ollamaUrl + '/api/tags');        
            models = response.data;
            mcache.put('models', models, 1000 * 60 * 60); // Cache for 1 hour            
        } catch (error) {
            console.error('Error getting Ollama models:', error);
            return null;
        }    
    }
    return models;
}

// simple async sleep
exports.sleep = async (ms) =>{
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

var globalKey = null;
// generate a unique reference for this worker
function getReference(){
  if (!globalKey){
    globalKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  return globalKey;
}

// fix up any fields that have lost their type in transit
function fixRequest(request){
  if (request.stream){
    // test if stream is a string
    if (typeof request.stream === 'string' || request.stream instanceof String){
      request.stream = request.stream=="true";
    }
  }

  return request;
}
exports.processRequest = async () => {
  const serverUrl = process.env.SERVER_URL;
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaApiKey = process.env.FLOCKOLLAMA_PUBLIC_KEY;
  let models = await getOllamaModels();
  let success = false;
  let tokens = 0;
  let response = null;
  try {
    let request =  {models:models.models, reference:getReference()};    
    response = await axios.post(serverUrl + '/api/pull', request, {
      headers: { 'Authorization': `Bearer ${ollamaApiKey}` },
    });

    if (!response || !response.data || response.data.error) {
        console.error('Error processing request:', response.data.error);        
    }
    else if (response.data.job) {
        let path = response.data.path;
        let request = response.data.request;  
        let id = response.data.id;      

        request = fixRequest(request);
        console.log("Got some work using model: " + request.model);

        let ollamaResponse = await axios.post(ollamaUrl + path, request, config);

        let pushData = {id:id, response:ollamaResponse.data};

        // post the response back to the server
        let targetRequest = await axios.post(serverUrl + '/api/push', pushData, {
          headers: { 
            'Authorization': `Bearer ${ollamaApiKey}` },
          responseType:'stream'
        });

        ollamaResponse.data.on('data', (chunk) => {
          // Send each chunk of data to the target server
          targetRequest.then((targetResponse) => {
            if (targetResponse.status !== 200) {
              console.error(`Error streaming to target server: ${targetResponse.statusText}`);
            } else {
              targetRequest.response.write(chunk); // Write the chunk to the target request stream
            }
          }).catch((error) => {
            console.error(`Error sending data to target server: ${error}`);
          });
        });
    
        response.data.on('end', () => {
          console.log('Ollama data streamed successfully.');
          targetRequest.then((targetResponse) => {
            targetRequest.data.end(); // Close the target stream after Ollama data ends
          }).catch((error) => {
            console.error(`Error finalizing target stream: ${error}`);
          });
        });
    
        response.data.on('error', (error) => {
          console.error(`Error streaming Ollama data: ${error}`);
          targetRequest.cancel(); // Cancel the target request on Ollama data stream error
        });
                  
    }
    else{
      console.log("Yawn...");      
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return {success:false, sleep:3000, tokens:0};
  }
  return {success:success, sleep:response.data.sleep || 0, tokens:tokens};
}

