const express = require('express');
const http = require('http');
const picturesRouter = require('./routes/pictures');
const port = process.env.PORT || '8000';

var app = express(),
	server;

app.set('views', './views');
app.set('view engine', 'pug');

app.use('/', picturesRouter);
app.use('/picture', express.static('shots'));

server = http.createServer(app).listen(port);
server.on('listening', function () {
    console.log("Listening on port " + port);
});
