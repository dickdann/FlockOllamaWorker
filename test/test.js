const worker = require('../src/worker');
const request = require('supertest');
let expect;



before(async function() {
  // Dynamically import chai and set expect
  const chai = await import('chai');
  expect = chai.expect;
});

describe('Test Ollama is running', () => { 
    it('should return true', async () =>{
        const models = await worker.getOllamaModels();
        expect(models).to.be.a('object'); // Ensure the result is an object
        expect(models.models).to.be.a('array'); // Ensure the result is an array                
    });
});

describe('test .env file is setup properly', () => {
    it('should have OLLAMA_URL,SERVER_URL, FLOCKOLLAMA_PUBLIC_KEY variables set', async () => {
        expect(process.env.OLLAMA_URL).to.be.a('string');
        expect(process.env.SERVER_URL).to.be.a('string');
        expect(process.env.FLOCKOLLAMA_PUBLIC_KEY).to.be.a('string');
    });

    it('Should be able to ping the Flockollamas server', async () => {
        const serverUrl = process.env.SERVER_URL;
        const response = await request(serverUrl).get('/ping');
        expect(response.status).to.equal(200);
        expect(response.text).to.equal('pong');
    });
});
