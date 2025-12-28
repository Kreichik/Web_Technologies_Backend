const { json } = require('body-parser');
const express = require('express');
const fs = require('fs');
const { encode } = require('punycode');
const request = require('request');

let app = express();
app.use(express.static('public')); 
app.use(express.json());

// 51.090834, 71.418358 - AITU
app.get('/weather', (req, res) => {
    request(
        'https://api.openweathermap.org/data/2.5/weather?lat=51.09&lon=71.44&appid=f8adbeb902a13e522fc52eda669ef9a9&units=metric',
        (err, response, body) => {
            if (err)
                return res
                    .status(500)
                    .send({ message: err });

            const data = JSON.parse(body);

            const weather = {
                temperature: data.main.temp,
                description: data.weather[0].description,
                coordinates: data.coord,
                feels_like: data.main.feels_like,
                wind_speed: data.wind.speed,
                country_code: data.sys.country,
                rain_volume: data.rain?.['3h'] || 0,
                icon: data.weather[0].icon
            };

            return res.send(weather);
        }
    );
})

app.get('/search-teacher', (req, res) => {
    const name = req.query.name;

    const encodeName = encodeURIComponent(name);

    const url = `https://du.astanait.edu.kz:8765/astanait-teacher-module/api/v1/teacher/pps/get-all-teachers?fullName=${encodeName}`

    request(url, (err, response, body) => {
        if (err)
            return res
                .status(500)
                .send({ message: err });

        res.send(body);
    });
})

app.get('/get-teacher-info', (req, res) => {
    const userId = req.query.id;
    const url = `https://du.astanait.edu.kz:8765/astanait-authorization-module/api/v1/auth/get-user-by-id?user_id=${userId}`

    request(url, (err, response, body) => {
        if (err)
            return res
                .status(500)
                .send({ message: err });

        res.send(body);
    });
})


app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
})