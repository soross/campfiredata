var express = require('express')
var http = require('http')
var request = require('request')
var server = express();
var dataJson = require("./store/data.json");
var Client= require("./db").Client;


//setup rest server

server.configure( function(){
  server.use(express.static(__dirname + '/public'));
});

server.get ('/', function(req, res){
  res.redirect('/index.html');
});

server.get('/data', function(req, res) {
  return res.json(dataJson)
});

server.get('/data/:id', function (req, res){
  return Client.findById(req.params.id, function (err, json) {
    if (!err) {
      return res.send(json);
    } else {
      return console.log(err);
    }
  });
});

var port = process.env.PORT || 9000;
server.listen(port);


