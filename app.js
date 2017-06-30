const fs = require('fs');
const path = require('path');
const express = require('express');
const exec = require('child_process').exec;
const http = require('http');
const moment = require('moment');
const redis = require('redis');
const port = process.env.PORT || '8000';

const picturePath = "/tmp/camera_pic.jpg";
const camera_command = "raspistill -w 1296 -h 972 -q 10 -ex verylong -ISO 800 -rot 270 -o %s";
const shots_dir = "/home/pi/camera/shots/";
const PAGE_SIZE = 24;

var app = express();
var client = redis.createClient();


app.set('views', './views');
app.set('view engine', 'pug');

app.use('/picture', express.static('shots'));

app.get('/list', (req, res) => {
    var page = 0;
    if (req.query.page) {
        page = Math.max(0, parseInt(req.query.page));
    }
    client.lrange("photos", page * PAGE_SIZE, 1 + (page + 1) * PAGE_SIZE, (noidea, photos) => {
        res.render('list', {
            photos: photos.map((pic) => {return "picture/" + pic;}),
            nextPage: "list?page=" + (page + 1),
            prevPage: "list?page=" + Math.max(0, page - 1)
        });
    });
});

app.get('/', (req, res, next) => {
    res.redirect("/camera");
});

app.get('/save', (req, res, next) => {
    const file = "camera_" + moment().format("YYYYMMDD_HHmm") + ".jpg",
        child = exec(camera_command.replace("%s", shots_dir + file), (error, stdout, stderr) => {
            client.lpush("photos", file);
            res.send({ok: true});
        });
});

app.get('/camera', (req, res, next) => {
    exec(camera_command.replace("%s", picturePath), (error, stdout, stderr) => {
        res.sendFile(picturePath, {headers: {"Content-type": "image/jpeg"}},
            () => {
                if (req.query.save === undefined) {
                    fs.unlink(picturePath);
                }
            }
        );
    });
});

var server = http.createServer(app).listen(port);
server.on('listening', function () {
    console.log("Listening on port " + port);
});
