const redis = require('redis');
const express = require('express');
const moment = require('moment');
const exec = require('child_process').exec;
const fs = require('fs');

const picturePath = '/tmp/camera_pic.jpg';
const cameraCommand = 'raspistill -w 1296 -h 972 -q 10 -ex verylong -ISO 800 -rot 270 -o %s';
const shotsDir = '/home/pi/camera/shots/';
const PAGE_SIZE = 24;

var router = express.Router();
var client = redis.createClient();

router.get('/list', (req, res) => {
    var page = 0;
    if (req.query.page) {
        page = Math.max(0, parseInt(req.query.page, 10));
    }
    client.lrange('photos', page * PAGE_SIZE, 1 + ((page + 1) * PAGE_SIZE), (noidea, photos) => {
        res.render('list', {
            photos: photos.map(pic => 'picture/' + pic),
            nextPage: 'list?page=' + (page + 1),
            prevPage: 'list?page=' + (Math.max(0, page - 1))
        });
    });
});

router.get('/', (req, res) => {
    res.redirect('/camera');
});

router.get('/save', (req, res) => {
    const file = 'camera_' + moment().format('YYYYMMDD_HHmm') + '.jpg';

    exec(cameraCommand.replace('%s', shotsDir + file), () => {
        client.lpush('photos', file);
        res.send({ ok: true });
    });
});

router.get('/camera', (req, res) => {
    exec(cameraCommand.replace('%s', picturePath), () => {
        res.sendFile(
			picturePath,
			{ headers: { 'Content-type': 'image/jpeg' } },
            () => {
                if (req.query.save === undefined) {
                    fs.unlink(picturePath, (err) => {
                        err && console.log('Error removing temporary file');
                    });
                }
            }
        );
    });
});

module.exports = router;
