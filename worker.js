const axios = require('axios');
const mcache = require('memory-cache');
require('dotenv').config();

async function getOllamaModels(){
    const ollamaUrl = process.env.OLLAMA_URL;
    let models = mcache.get('models');

    if (!models) {    
        try {
            const response = await axios.get(ollamaUrl + '/v1/models');        
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

exports.processRequest = async () => {
  const serverUrl = process.env.SERVER_URL;
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaApiKey = process.env.FLOCKOLLAMA_PUBLIC_KEY;
  let models = await getOllamaModels();
  let success = false;
  let tokens = 0;
  let response = null;
  try {
    let request = {models: models};    
    response = await axios.post(serverUrl + '/api/pull', request, {
      headers: { 'Authorization': `Bearer ${ollamaApiKey}` },
    });

    if (response.data.error) {
        console.error('Error processing request:', response.data.error);        
    }
    else if (response.data.job) {
        console.log('Request found');
        let path = request.data.path;
        let request = request.data.request;
        // turn off streaming for now!
        request.data.request.stream = false;

        let response = await axios.post(ollamaUrl + path, request);
        console.log('Successfully processed request.');

        // post the response back to the server
        let pushResponse = await axios.post(serverUrl + '/api/push', response.data, {
          headers: { 'Authorization': `Bearer ${ollamaApiKey}` },
        });
        success = true;
        tokens = pushResponse.data.tokens;
        console.log('Successfully pushed response back to server.  Earnings: ' + tokens);
    }
    else{
      console.log("Yawn...");      
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
  }
  return {success:success, sleep:response.data.sleep || 0, tokens:tokens};
}

