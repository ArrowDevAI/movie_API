const mongoose = require('mongoose');
const bcrypt = require ('bcrypt');

let movieSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Runtime: {type: String},
    Genre: {
    Name: String,
    Description: String
    },
    Director: {
      Name: String,
      Bio: String
    },
    Actors: [String],
    ImagePath: String,
    Featured: Boolean,
   

  });

let userSchema = mongoose.Schema(
  {
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: {type: Date},
    Img: {type: String, default:"https://static.vecteezy.com/system/resources/previews/009/734/564/original/default-avatar-profile-icon-of-social-media-user-vector.jpg"},
    FavoriteMovies: [{type: mongoose.Schema.Types.ObjectID, ref: 'Movie'}]
});
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password) {
return bcrypt.compareSync (password, this.Password);
};


let Movie = mongoose.model ('Movie', movieSchema);
let User = mongoose.model ('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
