const express = require('express');
const fs = require('fs');
const dbPath = './data.json';

let app = express();

app.use(express.json());

app.get('/', (request, response) => {
    response.send('Server is running');
    // response.sendFile(__dirname + '/index.html');
})

app.get('/hello', (request, response) => { 
    response.json({ message: 'Hello from server!' });
})

app.get('/time', (request, response) => {
    response.send(Date());
});

app.get('/status', (request, response) => {
    response.sendStatus(200);
})

app.get('/tickets', (request, response) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            response.status(500).send('Error reading data');
            return;
        }
        response.json(JSON.parse(data));
    })
})

app.post('/tickets', (request, response) => {
    fs.readFile(dbPath, 'utf-8', (err, data) => {
        
    })
})

app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
})