/**
 * @module
 * movieApi
 * @description Application for managing movies and users
 */
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
bodyParser = require('body-parser');

const { check, validationResult } = require ('express-validator');
const mongoose = require('mongoose');
const models = require('./models.js');
let Movies = models.Movie;
let Users = models.User;
/**
 * @constant {Promise} mongoConnection
 * @description Connects to MongoDB using the URI parameter, CONNECTION_URI, from Heroku (local connection commented out).
 * @param {string} uri - The MongoDB connection URI.
 * @returns {Promise} Resolves when the connection is successful or throws an error if the connection fails.
 */
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
/**
 * mongoose.connect('mongodb://localhost:27017/moviedb', { useNewUrlParser: true, useUnifiedTopology: true });
 */

/**
 * Logging setup for the application
 * Logs all requests to a log file in 'public/log.txt'
 */
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/public/log.txt'), { flags: 'a' })
app.use(morgan('common', { stream: accessLogStream }));
app.use(express.static('public'));

/**
 * @description CORS configuration to allow specific origins/methods/headers
 */
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:1234', 'http://127.0.0.1:8080','http://localhost:4200', 'https://myflixurl.netlify.app', 'https://arrowdevai.github.io'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));  

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

/**
 * @constant {GET} /movies
 * @description Fetches an array of movies from the database as JSON objects. Requires token to be passed in the req header
 * @access Protected
 * @async
 */
  app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movies = await Movies.find();
        res.status(200).json(movies); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});
/**
 * @constant {GET} /movies/:title
 * @description Fetches movie by title. Requires token to be passed in the req header
 * @access Protected
 * @async
 */
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
/**
 * @constant {GET} /movies/directors/:name
 * @description Fetches movie by director. Requires token to be passed in the req header
 * @access Protected
 * @async
 */
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
/**
 * @constant {GET} /movies/genres/:name
 * @description Fetches movie by genre. Requires token to be passed in the req header
 * @access Protected
 * @async
 */

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
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return a JSON response with the error details and a custom message
        return res.status(422).json({
            status: 422,
            message: 'Validation errors occurred',
            errors: errors.array() // Include the array of errors
        });
        
    }

    // Hash the password
    const hashedPassword = Users.hashPassword(req.body.Password)
    try {
        // Check if the user already exists
        const existingUser = await Users.findOne({ Username: req.body.Username });

        if (existingUser) {
            return res.status(400).json({ message: `${existingUser.Username} already exists` });
        } 
        // Create a new user
        const newUser = await Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        });
        return res.status(201).json({ message: `${newUser.Username} was successfully added` });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An internal server error occurred. Please try again.' });
    }
    
});


const bcrypt = require('bcryptjs');
/**
 * @constant {PUT} /users/:Username
 * @description Amends user information. Requires token to be passed in the req header
 * @access Protected
 * @async
 */
app.put('/users/:Username',[
    check('Username', 'Username must be at least 5 characters long').optional().isLength({ min: 5 }),
    check('Username', 'Username contains non-alphanumeric characters - not allowed').optional().isAlphanumeric(),
    check('Email', 'Email does not appear to be valid').optional().isEmail(),
], 
passport.authenticate('jwt', { session: false }), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: 422,
            message: 'Validation errors occurred',
            errors: errors.array() // Include the array of errors
        });
        
    }
    
    if (req.user.Username !== req.params.Username) {
        return res.status(403).json({ message: 'Permission Denied' });
    }
    
    const updateFields = {};
    const { currentPassword, newPassword } = req.body;

    if (currentPassword && newPassword) {
        try {
            // Fetch the user from the database
            const user = await Users.findOne({ Username: req.params.Username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Compare current password with stored hashed password
            const isMatch = await bcrypt.compare(currentPassword, user.Password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
        
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateFields.Password = hashedPassword;
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error: ' + err });
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
        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error: ' + err });
    }
});


/**
 * @constant {DELETE} /users/:Username
 * @description Removes a user. Requires token to be passed in the req header
 * @access Protected
 * @async
 */

app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
              res.status(400).json({ message: `${req.params.Username} was not found` });
            } else {
                res.status(200).json({ message: `${req.params.Username} was deleted` });
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * @constant {POST} /users/:Username/movies/:MovieID
 * @description Adds movie to user Favorites. Requires token to be passed in the req header
 * @access Protected
 * @async
 */
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
/**
 * @constant {DELETE} /users/:Username/movies/:MovieID
 * @description Removes movie from user Favorites. Requires token to be passed in the req header
 * @access Protected
 * @async
 */
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

