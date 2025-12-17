const http = require('http');

const fs = require('fs');

function requestHandler(request, response) {
    console.log(`Request URL: ${request.url}`);

    response.setHeader('Content-Type', 'text/html');

    let filename = request.url.substring(1);

    fs.access(filename, fs.constants.R_OK, (error) => {
        if (error) {
            response.write('This page does not exist');
            response.end();
        } else {
            fs.createReadStream(filename).pipe(response);
        }
    });

    // if (request.url === '/main' || request.url === '/') {
    //     fs.createReadStream('index.html').pipe(response);
    // } else if (request.url === '/info') {
    //     response.write('<h2>Info page</h2>');
    // } else {
    //     response.statusCode = 404;
    //     response.write('<h2>Page not found</h2>')
    // }
    // response.end();
}

let server = http.createServer(requestHandler);

function onServerStart() {
    console.log('Server started at http://localhost:3000');
}

server.listen(3000, onServerStart);