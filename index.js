const express = require('express');
const app = express();
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
uuid = require('uuid');
bodyParser = require('body-parser');
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/public/log.txt'), {flags: 'a'})
app.use(morgan('common', {stream: accessLogStream}));
app.use(express.static('public'));
app.use(bodyParser.json());

let topMovies= [
    {
        title: "Inception",
        rating: "9.3/10"
    },
    {
        title: "The Shawshank Redemption",
        rating: "9.3/10"
    },
    {
        title: "The Dark Knight",
        rating: "9.0/10"
    },
    {
        title: "Pulp Fiction",
        rating: "8.9/10"
    },
    {
        title: "Forrest Gump",
        rating: "8.8/10"
    },
    {
        title: "The Matrix",
        rating: "8.7/10"
    },
    {
        title: "Interstellar",
        rating: "8.6/10"
    },
    {
        title: "The Godfather",
        rating: "9.2/10"
    },
    {
        title: "Schindler's List",
        rating: "8.9/10"
    },
    {
        title: "Gladiator",
        rating: "8.5/10"
    }
];

let genres = [
    {
        title: "Comedy",
        data: "Comedy is a genre of entertainment, literature, film, and performing arts that aims to provoke laughter and amuse its audience. It often uses humor, wit, satire, and exaggeration to create a lighthearted and enjoyable experience."
    }, {
        title: "Sci-Fi",
        data: "Science fiction (sci-fi) is a genre of speculative fiction that explores imaginative concepts and futuristic technologies often based on scientific principles, discoveries, or possibilities. It typically involves scenarios that are not currently possible or have not yet been realized, and it often explores the consequences of advancements in science and technology on society, individuals, or the environment."
    }, {
        title: "Documentary",
        data: "A documentary is a non-fictional film or video production that aims to document reality, provide information, educate, or explore a particular subject or issue. Documentaries present factual content and often incorporate interviews, archival footage, narration, and investigative journalism to convey their message. "
    }
];
let directors = [
    {
        name: "Martin Scorsese",
        height: "5ft. 4in."
    }, {
        name: "Wes Anderson",
        height: "6ft. 1in."
    }, {
        name: "Quentin Tarantino",
        height: "6ft. 1in."
    }
];

let users = [
    {
        userName:'testUser',
        password:'testPass'
    }
];

let favorites = [
    {
        "title":"Movie Name"
        }
];

app.get("/movies", (req,res)=>{
    res.json(topMovies);
});

 let registerRepository = (function (){

    app.get("/users", (req,res)=>{
        res.json(users);
        function userList(){
            return users;
        }
        return {
            userList:userList
        }
    });
    })();  

app.get('/movies/:title', (req,res)=>{
    res.json(topMovies.find((movie)=>{
    {
            return movie.title === req.params.title
    }
    }))
});
app.get('/movies/directors/:name', (req,res)=>{
    res.json(directors.find((director)=>{
    {
            return director.name === req.params.name
    }
    }))
});
app.get('/movies/genres/:title', (req,res)=>{
    res.json(genres.find((genre)=>{
    {
            return genre.title === req.params.title
    }
    }))
});


app.post('/users/register', (req,res)=>{
    let newUser = req.body;

    if (!newUser.userName) {
        const message = "Missing Username in Request Body"
        res.status(400).send(message)
    }
        else if (!newUser.password) {
            const message = "Missing Password in Request Body"
            res.status(400).send(message)
    }else {
        users.push(newUser);
        res.status(201).send(newUser.userName + " added")
    }
});

app.put('/users/:userName/:newUserName',(req,res)=>{
    let newUserName = req.params.newUserName
    let user = users.find((user)=>{
        return user.userName === req.params.userName
        });
        if (user) {
           user.userName = req.params.newUserName
           let newUsername = req.params.newUserName
            res.status(201).send(`Username changed to ${newUserName}`)
        }else{
            res.status(404).send ('User not found, sorry');
        }
});

app.delete('/users/:userName', (req,res)=>{
    let user = users.filter((user)=>{
        return user.userName !== req.params.userName
    })
    if (user)
        {
            users = users.filter((user)=>{
                return user.userName !== req.params.userName
            });
        }
    res.status(201).send('User, ' + req.params.userName +', was deleted.' );
});


app.get("/", (req,res)=>{
    res.send('Welcome to my Movies page');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Error');
  });

  app.get("/users/:userName/favorites", (req,res)=>{
    res.json(favorites);
  });

app.post('/users/:userName/favorites', (req,res)=>{
    let newFavorite = req.body
    if (!newFavorite.title) {
        const message = "Missing Movie Title"
        res.status(400).send(message)
    }else {
        favorites.push(newFavorite);
        res.status(201).send(newFavorite)
    }
});

app.delete('/users/:userName/favorites/:title', (req,res)=>{
    let movie = favorites.find((movie)=>{
        return movie.title === req.params.title
    })
    if (movie)
    {
        favorites = favorites.filter((movie)=>{
            return movie.title !== req.params.title
        });
    }
    res.status(201).send('The Movie, ' + req.params.title +', was deleted.' );
});

app.listen(8080, () => {
    console.log('Your app is now listening on port 8080.');
});