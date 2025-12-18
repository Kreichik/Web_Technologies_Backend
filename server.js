const express = require('express');
const fs = require('fs');
const dbPath = './data.json';
const { v4: uuidv4 } = require('uuid');

let app = express();

app.use(express.json());

function readData(){
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
}

function writeData(data){
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

app.get('/', (request, response) => {
    response.send('Server is running');
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
        data = readData();
        response.json(data);
    })
})

app.post('/tickets', (request, response) => {
    fs.readFile(dbPath, 'utf-8', (err, data) => {
        if (err) {
            response.status(500).send('Error reading data');
            return;
        }

        const dbData = readData();
        const newTicket = { id: uuidv4(),
            name: request.body.name,
            price: request.body.price,
            date: request.body.date
         };

        dbData.tickets.push(newTicket);

        writeData(dbData);

        response.status(201).json(newTicket);
     
    })
})

app.put('/tickets/:id', (request, response) => {
    if (!request.params.id) {
        response.status(400).send('Ticket ID is required');
        return;
    }

    const dbData = readData();
    const ticketIndex = dbData.tickets.findIndex(ticket => ticket.id === request.params.id);
    if (ticketIndex === -1) {
        response.status(404).send('Ticket not found');
        return;
    }
    dbData.tickets[ticketIndex] = {
        id: request.params.id,
        ...request.body
    };

    writeData(dbData);
    response.json(dbData.tickets[ticketIndex]);

});

app.delete('/tickets/:id', (request, response) => { 
    if (!request.params.id) {
        response.status(400).send('Ticket ID is required');
        return;
    }

    const dbData = readData();
    const ticketIndex = dbData.tickets.findIndex(ticket => ticket.id === request.params.id);
    if (ticketIndex === -1) {
        response.status(404).send('Ticket not found');
        return;
    }
    dbData.tickets.splice(ticketIndex, 1);
    writeData(dbData);
    response.json({ success: 'true' });
});

app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
})