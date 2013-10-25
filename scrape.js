// var fs = require("fs");
var async = require("async");
var Campfire = require("./lib/campfire").Campfire;
var Scraper = require("./lib/scraper").Scraper;

var Day = require("./db").Day;
var User = require("./db").User;
var Message = require("./db").Message;
var Blob = require("./db").Blob;

// setup data scraping
var instance = new Campfire({
  ssl: true,
  token: 'yours here', ////Add your API token
  account: 'yourse here' ////Add your account name
});

var scraper = new Scraper({
  campfire: instance,
  // roomID: '489906' //GYBO Imrovements  
  // roomID: '536077' // GCL
  roomID: '415633' // Stamstich
});


scraper.init(function() {
  console.log('scraper start')

  //scrape data once scrpaer is initialized
  scraper.scrapeText(function(dataObject) {
    console.log('init db storing')

    // //save dates to db
    async.forEach(
      dataObject.days, 
      function(day, cb){
        new Day({
          date: day.date,
          count: day.count,
        }).save(function (err) {
          if (err) return console.log(err)
          cb();
        });
      }, 
      function(err){
        console.log('dates added to db')
      }
    );


    // //save users to db
    async.forEach(
      dataObject.people, 
      function(user, cb){
        //convert all message ids to mongo objectIds
        dataMessages = []
        for (var j = 0; j < user.messages.length; j++) {
          messageId = user.messages[j]
          newId = messageId
          dataMessages.push(newId)
        };

        new User({
          _id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          type: user.type,
          created_at: user.created_at,
          entries: user.entries,
          exits: user.exits,
          messages: user.messages
        }).save(function (err) {
          if (err) return console.log(err)
          cb();
        });
      }, 
      function(err){
        console.log('users added to db')
      }
    );

    // save messages to db
    async.forEachLimit(
      dataObject.messages, 
      5,
      function(message, cb){
        new Message({
          _id: message.id,
          user_id: message.user,
          date: message.date,
          body: message.body
        }).save(function (err) {
          if (err) return console.log(err)
          cb();
        });
      }, 
      function(err){
        console.log('messages added to db')
      }
    );

   // create and store textblob in db
    async.forEachLimit(
      dataObject.textLump, 
      5,
      function(lump, cb){
        new Blob({
          word: lump
        }).save(function (err) {
          if (err) return console.log(err)
          cb();
        });
      }, 
      function(err){
        console.log('blobs added to db')
      }
    );

  });
});





