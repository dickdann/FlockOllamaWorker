const axios = require('axios');
const http = require('http');
const mcache = require('memory-cache');
const { hostname } = require('os');
require('dotenv').config();
var running = false;


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
function fixRequest(request, path){
  if (request.stream){
    // test if stream is a string
    if (typeof request.stream === 'string' || request.stream instanceof String){
      request.stream = request.stream=="true";
    }
  }
  
  return request;
}

exports.isRunning = () => {
  return running;
}

exports.processRequest = async () => {
  const serverUrl = process.env.SERVER_URL;
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaApiKey = process.env.FLOCKOLLAMA_PUBLIC_KEY;
  let models = await getOllamaModels();
  let success = false;
  let tokens = 0;
  let response = null;
  if (running){
    console.log("Already running a job...");
    return false;
  }
  
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
        running = true;
        request = fixRequest(request, path);
        console.log("Got some work using model: " + request.model);

        
        let ollamaRequest = http.request(ollamaUrl,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',          
          },
          path: path
        },
        (ollamaResponse) => {                   
          if (ollamaResponse.statusCode !== 200) {
            console.error(`Request failed with status: ${ollamaResponse.statusCode}`);
            running = false;
            return;
          }
          const pushRequest = http.request(serverUrl + '/api/push', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ollamaApiKey}`,
              'Content-Type': 'application/octet-stream',
              'id':id
            }
          });
          ollamaResponse.on('data', (chunk) => {
            pushRequest.write(chunk);            
          });
          ollamaResponse.on('end', () => {
            running = false;
            pushRequest.end();
          });
         pushRequest.on('error', (error) => {
            console.error(`problem with request: ${error.message}`);
          });
        });

        ollamaRequest.on('error', (error) => {
          console.error(`problem with request: ${error.message}`);
        });

        ollamaRequest.write(JSON.stringify(request));
        ollamaRequest.end();
                  
    }
    else{
      console.log("Yawn...");      
      return {success:false, sleep:3000, tokens:0};
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return {success:false, sleep:3000, tokens:0};
  }
  
}

