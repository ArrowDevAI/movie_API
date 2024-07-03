const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
uuid = require('uuid');
bodyParser = require('body-parser');
const routes = require ("./routes.js");

const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const models = require('./models.js');
let Movies = models.Movie;
let Users = models.User;
//mongoose.connect('mongodb://localhost:27017/moviedb', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true }
);

//creation of a log
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/public/log.txt'), { flags: 'a' })

app.use(morgan('common', { stream: accessLogStream }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use('/', routes)

//CORS
const cors = require('cors');
let allowedOrigins = ['http://127.0.0.1:8080/']
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'The CORS policy for this application does not allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Error');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ', port);
});

