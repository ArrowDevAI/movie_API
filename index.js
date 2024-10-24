const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
uuid = require('uuid');
bodyParser = require('body-parser');

const { check, validationResult } = require ('express-validator');
const mongoose = require('mongoose');
const models = require('./models.js');
let Movies = models.Movie;
let Users = models.User;
//mongoose.connect('mongodb://localhost:27017/moviedb', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//creation of a log
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/public/log.txt'), { flags: 'a' })
app.use(morgan('common', { stream: accessLogStream }));
app.use(express.static('public'));
app.use(bodyParser.json());
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:1234', 'http://127.0.0.1:8080','http://localhost:4200', "https://myflixurl.netlify.app"], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));  

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.find()
        .then((users) => {
            res.status(201).send(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
      .then((movies) => {
        console.log(movies[0])
        res.status(201).json(movies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ Title: req.params.title })
        .then((title) => {
            res.json(title);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

app.get('/movies/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ 'Director.Name': req.params.name })
        .then((director) => {
            res.json(director);
        })

        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err)
        });
});


app.get('/movies/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ 'Genre.Name': req.params.name })
        .then((genre) => {
            res.json(genre);
        })

        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err)
        });
});


app.post('/users',
[      
    check ('Username', 'Username is required',).isLength({min:5}), 
    check('Username', 'Username contains non alphanumeric characers - not allowed').isAlphanumeric(),
    check ('Password', 'Password Required').not().isEmpty(),
    check ('Email', 'EMail does not appear to be valid').isEmail()
],
async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()){
        return res.status(422).json({errors: errors.array()});
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + ' already exists');
            } else {
                Users.create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                    .then((user) => { res.status(201).json(user.Username + ' added') })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error: ' + error);
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

const bcrypt = require('bcryptjs');

app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.Username !== req.params.Username) {
        return res.status(403).send('Permission Denied');
    }
    
    const updateFields = {};
    const { currentPassword, newPassword } = req.body;

    if (currentPassword && newPassword) {
        try {
            // Fetch the user from the database
            const user = await Users.findOne({ Username: req.params.Username });
            if (!user) {
                return res.status(404).send('User not found');
            }
            // Compare current password with stored hashed password
            const isMatch = await bcrypt.compare(currentPassword, user.Password);
            if (!isMatch) {
                return res.status(400).send('Current password is incorrect');
            }
        
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateFields.Password = hashedPassword;
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error: ' + err);
        }
    }

    if (req.body.Username) {
        updateFields.Username = req.body.Username;
    }
    if (req.body.Email) {
        updateFields.Email = req.body.Email;
    }
    if (req.body.Birthday) {
        updateFields.Birthday = req.body.Birthday;
    }

    try {
        // Update the user in the database
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $set: updateFields },
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});




app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.get("/", (req, res) => {
    res.send('Welcome to my Movies page');
});

app.get('/users/:userName/favorites', (req, res) => {
    res.json(favorites);
});

app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $addToSet: { FavoriteMovies: req.params.MovieID }
    },
        { new: true })
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {

    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
    },
        { new: true })
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Error');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on port ', port);
});

