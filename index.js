const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
uuid = require('uuid');
bodyParser = require('body-parser');
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/public/log.txt'), { flags: 'a' })
app.use(morgan('common', { stream: accessLogStream }));
app.use(express.static('public'));
app.use(bodyParser.json());
//Mongoose and MongoDB Dependencies 
const mongoose = require('mongoose');
const models = require('./models.js');
let Movies = models.Movie;
let Users = models.User;
mongoose.connect('mongodb://localhost:27017/moviedb', { useNewUrlParser: true, useUnifiedTopology: true });


app.get('/users', async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).send(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  
  app.get('/movies', async (req, res) => {
    await Movies.find()
      .then((movie) => {
        res.status(201).send(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

app.get('/movies/:title', async (req, res) => {
    await Movies.findOne({Title: req.params.title})
    .then ((title)=>{
        res.json(title);
    })
    .catch ((err)=>{
        console.error(err);
        res.status(500).send('Error ' + err);
    });
});

app.get('/movies/directors/:name', async (req, res) => {
   await Movies.find({'Director.Name' : req.params.name})
    .then ((director)=>{
        res.json(director);
    })

    .catch ((err)=>{
        console.error(err);
        res.status(500).send ('Error ' + err)
    });
});


app.get('/movies/genres/:name', async (req, res) => {
    await Movies.find({'Genre.Name' : req.params.name})
     .then ((genre)=>{
         res.json(genre);
     })
 
     .catch ((err)=>{
         console.error(err);
         res.status(500).send ('Error ' + err)
     });
 });



app.post('/users', async (req, res) => {
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users.create({
                        Username: req.body.Username,
                        Password: req.body.Password,
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


app.put('/users/:Username', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true })
    .then((updatedUser) => {
      res.json(updatedUser.Username + " updated");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error ' + err);
    })
  
  });

  app.delete('/users/:Username', async (req, res) => {
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

app.get("/users/:userName/favorites", (req, res) => {
    res.json(favorites);
});

app.post('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
       $addToSet: {FavoriteMovies: req.params.MovieID }
     },
     { new: true })
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error '+ err);
    });
  });

  app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
       $pull: {FavoriteMovies: req.params.MovieID }
     },
     { new: true })
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error '+ err);
    });
  });

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Error');
});

app.listen(8080, () => {
    console.log('Your app is now listening on port 8080.');
});