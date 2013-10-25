var async = require("async");

var Scraper = function(options){ //Scrapes a campfire room
  this.instance = options.campfire;
  this.roomID = options.roomID;
  this.room = null;
  this.dates = [];
  this.isReady = false;
}

Scraper.prototype.init = function(callback){
  var that = this;
  this.isReady =
  that._getRoom(function(room){
    that._getDates(function(){
      callback();
    });
  });
}

Scraper.prototype._getRoom = function(callback){
  var that = this;
  this.instance.room(this.roomID, function(error, room){ 
    if (error) console.log(error)
    that.room = room;
    that.startDate = new Date(room.createdAt),
    that.endDate = new Date(),
    callback(room);
  });
}

Scraper.prototype._getDates = function(callback){
  var startDate = new Date(this.room.createdAt),
      endDate = new Date(),
      loopDate = startDate;

  while (loopDate <= endDate){
    this.dates.push(new Date(loopDate));
    var next = loopDate.getDate() + 1;
    loopDate.setDate(next);
  }
  callback();
}

Scraper.prototype._getPerson = function(id, callback){
  var person = null;

  this.instance.user(id, function(user){
    person = user;
    callback(person);
  });
}

Scraper.prototype.scrapeText = function(callback){ 
  var that = this,
      returnObject = {
        people: [],
        messages: [],
        days: [],
        textLump: ""
      }

  console.log('Intial scrape init')

  //each day
  async.each(
    //array
    that.dates, 

    //iterator
    function(day,cb){

      returnObject.days.push({
        date: day,
        count: 0
      });


      that.room.transcript(day, function(error, transcript){
      console.log(day)

        for (var j=0; j < transcript.length; j++){
          var message = transcript[j];

          // if message is a user
          if (message.userId != null){
            var user,
                people = returnObject.people,
                hasUser = hasObjectWithValue(people, 'id',  message.userId);

            that._getPerson(message.userId, function(person){
              user = person;
            });

            if (people.length != 0){
              if(!hasUser){
                people.push({
                  id: String(message.userId),
                  user: user,
                  entries: [],
                  exits: [],
                  messages: []
                });                
              }

            } else {
              console.log('its replacing')
              people[0] = {
                id: String(message.userId),
                user: user,
                entries: [],
                exits: [],
                messages: []
              }
            }

            var person = findObjectByAttr(people, 'id', message.userId);

            if (message.type == 'TextMessage'){
              //add messages to messages collection
              returnObject.messages.push({
                id: String(message.id),
                user: String(message.userId),
                date: day,
                body: message.body
              })
              person.messages.push(String(message.id))
              //add to count of messages in each day
              dayObj = findObjectByAttr(returnObject.days, 'date', day)
              dayObj.count += 1;
              //aggregate textLump string
              returnObject.textLump += message.body.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"") + " "; 
              // returnObject.textLump += message.body.replace(/[\.,!?]/g,"") + " "; 
              // returnObject.textLump += message.body
            }
            //add entry and exit messages
            
            if (message.type == 'EnterMessage')
              person.entries.push(message.createdAt)
            if (message.type == 'KickMessage')
              person.exits.push(message.createdAt)

          }

        }
        cb();
      });
    },
    //callback 
    function(err){
      console.log('intial scrape complete')
      returnObject.textLump = returnObject.textLump.split(' ')
      processUsers(returnObject, that.instance);
    }
  );


  //get user name & avatar based on ID
  function processUsers(returnObject, instance){
    console.log('Process users init')
    console.log(instance)
    async.forEach(
      returnObject.people, 
      function(person, cb){
        console.log('fetch user: ' + person.id)
        instance.user(person.id, function(error, response){
          if (error) return console.log(error)
          console.log(response)
          user = response.user;
          console.log(user)
          person.name = user.name;
          person.avatar_url = user.avatar_url;
          person.type = user.type;
          person.created_at = user.created_at;
          cb();
        })
      }, 
      function(err){
        console.log('users processed')
        callback(returnObject);
      }
    );
  }
}

exports.Scraper = Scraper;






//   UTILITIES
// ~~~~~~~~~~~~~~~~~

function hasObjectWithProp(array, prop){
  var hasObj = false,
      property = String(prop),
      obj;
  for (var i = 0; i < array.length; i++) {
    obj = array[i];
    if (obj.hasOwnProperty(property)) hasObj = true;
  };
  return hasObj;
}
function hasObjectWithValue(array, key, value){
  var hasVal = false,
      obj;
  for (var i = 0; i < array.length; i++) {
    objVal = array[i][key];
    if (objVal == value) hasVal = true;
  };
  return hasVal;
}
function findObjectByAttr(array, key, value){
  var obj;
  for (var i = 0; i < array.length; i++) {
    objVal = array[i][key];
    if (objVal == value) obj = array[i];
  };
  return obj;
}

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

function escapeHtml(string) {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}