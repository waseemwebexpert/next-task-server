const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const MT4_API_URL = 'https://mt4.mtapi.io';
const LAMBDA_URL = 'https://pdzsl5xw2kwfmvauo5g77wok3q0yffpl.lambda-url.us-east-2.on.aws/';

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify({ message: 'Connected to Backend...' }));

  ws.on('message', async (message) => {
    if (message == 'trade') {
      try {
        ws.send(JSON.stringify({ message: 'Get Master Trade... (Pinging Lambda Function)' }));

        const tradeDetails = await axios.get(LAMBDA_URL);
        
        ws.send(JSON.stringify({ message: 'Replicating Master Trade', tradeDetails: tradeDetails.data }));

        const loginResponse = await axios.get(`${MT4_API_URL}/Connect`, {
          params: {
            user: '44712225',
            password: 'tfkp48',
            host: '18.209.126.198',
            port: '443',
          }
        });
 

        const connectionId = loginResponse.data;
        const orderResponse = await axios.get(`${MT4_API_URL}/OrderSend`, {
          params: {
            id: connectionId,
            ...tradeDetails.data
          }
        });

        ws.send(JSON.stringify({ message: 'Successfully Replicated Master Trade', orderResponse: orderResponse.data }));
      } catch (error) {
        ws.send(JSON.stringify({ message: 'Error', error: error.message }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
