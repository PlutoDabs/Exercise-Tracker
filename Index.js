const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(express.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', (req, res) => {
  let newUser = new User({ username: req.body.username });
  newUser.save((err, savedUser) => {
    if (!err) {
      let responseObject = {};
      responseObject['username'] = savedUser.username;
      responseObject['_id'] = savedUser.id;
      res.json(responseObject);
    }
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (error, arrayOfUsers) => {
    if (!error) {
      res.json(arrayOfUsers);
    }
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let newExercise = new Exercise(req.body);
  newExercise.userId = req.params._id;
  if (newExercise.date === '') {
    newExercise.date = new Date().toISOString().substring(0, 10);
  }
  newExercise.save((error, savedExercise) => {
    if (!error) {
      User.findById(newExercise.userId, (error, userData) => {
        if (!error) {
          let responseObject = {};
          responseObject['_id'] = newExercise.userId;
          responseObject['username'] = userData.username;
          responseObject['date'] = new Date(newExercise.date).toDateString();
          responseObject['description'] = newExercise.description;
          responseObject['duration'] = newExercise.duration;
          res.json(responseObject);
        }
      });
    }
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  User.findById(req.params._id, (error, result) => {
    if (!error) {
      Exercise.find({ userId: req.params._id }, (error, result) => {
        if (!error) {
          let responseObject = {};
          responseObject['_id'] = req.params._id;
          responseObject['username'] = result.username;
          responseObject['count'] = result.length;
          responseObject['log'] = result.map((item) => {
            return {
              description: item.description,
              duration: item.duration,
              date: item.date.toDateString(),
            };
          });
          res.json(responseObject);
        }
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
