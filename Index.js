const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB...'))
.catch(err => console.error('Could not connect to MongoDB...', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  if (!req.body.username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = new User({ username: req.body.username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findById(req.params._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const exercise = new Exercise({
    user: user._id,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date) : new Date(),
  });

  await exercise.save();

  res.json({
    _id: user._id,
    username: user.username,
    date: exercise.date.toDateString(),
    duration: exercise.duration,
    description: exercise.description,
  });
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let query = Exercise.find({ user: user._id });

  if (req.query.from) {
    query = query.where('date').gte(new Date(req.query.from));
  }

  if (req.query.to) {
    query = query.where('date').lte(new Date(req.query.to));
  }

  if (req.query.limit) {
    query = query.limit(Number(req.query.limit));
  }

  const exercises = await query.exec();

  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
