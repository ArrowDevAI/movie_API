const express = require('express');
const app = express();
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/public/log.txt'), {flags: 'a'})
app.use(morgan('common', {stream: accessLogStream}));
app.use(morgan('common'));
app.use(express.static('public'));

let topMovies= [
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    },
    {
        title: "",
        rating: ""
    }

];

app.get("/movies", (req,res)=>{
    res.json(topMovies);
});
app.get("/", (req,res)=>{
    res.send('Welcome to my Movies page');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Error');
  });

app.listen(8080, () => {
    console.log('Your app is now listening on port 8080.');
});