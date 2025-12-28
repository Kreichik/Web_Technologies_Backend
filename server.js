const express = require('express');
const fs = require('fs');
const request = require('request');

let app = express();

app.use(express.json());

// 51.090834, 71.418358
app.get('/', (req, res) => {
    request(
        'https://api.openweathermap.org/data/2.5/weather?lat=51.09&lon=71.44&appid=f8adbeb902a13e522fc52eda669ef9a9',
        (err, response, body) => {
            if (err)
                return res
                    .status(500)
                    .send({ message: err });

            return res.send(body);
        }
    );
})



app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
})