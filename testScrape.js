var fs = require("fs");
var Campfire = require("./lib/campfire").Campfire;
var Scraper = require("./lib/scraper").Scraper;

var User = require("./db").User;
var Message = require("./db").Message;
var Blob = require("./db").Blob;

// setup data scraping
var instance = new Campfire({
  ssl: true,
  token: 'cb18d14d8dde352131858a5ed5663b3bf7c49b3b',
  account: 'nelsoncash'
});

var scraper = new Scraper({
  campfire: instance,
  // roomID: '536077' // GCL
  roomID: '415633' // Stamstich
});

userIds = [
        938007,
        938006,
        938005,
        938000,
        938008,
        938009,
        938010,
        958421,
        1035598,
        1056222,
        1127500,
        1132534,
        1168580,
        1176733,
        1202315,
        1229465,
        1242862,
        1244323,
        1249739,
        1247602,
        1255769,
        1274372,
        1283673,
        1306368,
        1330239,
        1337355,
        1340399,
        1341531,
        1358676,
        1370899,
        1383070,
        1396901,
        1402272,
        1411494
          ]

for (var i = 0; i < userIds.length; i++) {
  (function(i){
  instance.user(userIds[i], function(error, response){

    if (error) return console.log(error)
    console.log(i + " : "+ response.user.name)

  })
  })(i)
};



