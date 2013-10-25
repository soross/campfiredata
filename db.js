var mongoose = require('mongoose'),
    dbUrl = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/camp';

mongoose.connect(dbUrl);

var db = mongoose.connection

var daySchema = mongoose.Schema({
  _id: String,
  date: Date,
  count: Number
});

var userSchema = mongoose.Schema({
  _id: String,
  name: String,
  avatar_url: String,
  type: String,
  created_at: String,
  entries: [String],
  exits: [String],
  messages: [{ type: String, ref: 'Message' }]
});

var messageSchema = mongoose.Schema({
  _id: String,
  user_id: { type: String, ref: 'User' },
  date: String,
  body: String
});

var blobSchema = mongoose.Schema({
  word: [String]
});

var clientDataSchema = mongoose.Schema({
  _id: String,
  data: {}
});


var Day = mongoose.model('Day', daySchema);
var User = mongoose.model('User', userSchema);
var Message = mongoose.model('Message', messageSchema);
var Blob = mongoose.model('Blob', blobSchema);
var Client = mongoose.model('Client', clientDataSchema)


exports.db = db;
exports.Day = Day;
exports.User = User;
exports.Message = Message;
exports.Blob = Blob;
exports.Client = Client;
