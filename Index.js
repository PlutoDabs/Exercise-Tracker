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

mongoose.connect(process.env.MONGO_URI);

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

app.post('/api/users', async (req, res) => {
  let newUser = new User({ username: req.body.username });
  try {
    let savedUser = await newUser.save();
    let responseObject = {};
    responseObject['username'] = savedUser.username;
    responseObject['_id'] = savedUser.id;
    res.json(responseObject);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    let arrayOfUsers = await User.find({});
    res.json(arrayOfUsers);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  let newExercise = new Exercise(req.body);
  newExercise.userId = req.params._id;
  if (newExercise.date === '') {
    newExercise.date = new Date().toISOString().substring(0, 10);
  }
  try {
    let savedExercise = await newExercise.save();
    let userData = await User.findById(newExercise.userId);
    let responseObject = {};
    responseObject['_id'] = newExercise.userId;
    responseObject['username'] = userData.username;
    responseObject['date'] = new Date(newExercise.date).toDateString();
    responseObject['description'] = newExercise.description;
    responseObject['duration'] = newExercise.duration;
    res.json(responseObject);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    let result = await User.findById(req.params._id);
    let query = Exercise.find({ userId: req.params._id });

    if (req.query.from) {
      query = query.where('date').gte(new Date(req.query.from));
    }

    if (req.query.to) {
      query = query.where('date').lte(new Date(req.query.to));
    }

    if (req.query.limit) {
      query = query.limit(Number(req.query.limit));
    }

    let exerciseResult = await query.exec();

    let responseObject = {};
    responseObject['_id'] = req.params._id;
    responseObject['username'] = result.username;
    responseObject['count'] = exerciseResult.length;
    responseObject['log'] = exerciseResult.map((item) => {
      return {
        description: item.description,
        duration: item.duration,
        date: new Date(item.date).toDateString(),
      };
    });
    res.json(responseObject);
  } catch (err) {
    res.status(500).send(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
