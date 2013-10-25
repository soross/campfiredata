// Number of posts over time  XXX
// Total number of posts      XXX
// Total number of words      XXX
// Total number of days       XXX
// Total number of people     XXX
// 
// Treemap of every word      XXX ended up on bubble chart

// Most posts                 XXX
// Least posts                XXX

// Writes verbose posts       XXX
// Writes concise Posts       XXX

// Laughed the most           XXX
// Laughed the least          XXX

// Cursed the most            XXX  
// Cursed the least           XXX

// Asked the most questions   XXX
// Asked the least questions  XXX

// Post most gifs             XXX
// Post least gifs            XXX

// Talked about self most     XXX
// Talked about self Least    XXX






// var dataJson = require("./store/data.json");
var async = require("async");
var Day = require("./db").Day;
var User = require("./db").User;
var Message = require("./db").Message;
var Blob = require("./db").Blob;
var Client= require("./db").Client;
var db= require("./db").db;



// Get totals of data types
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function Totals(){
  this.dbDoc = new Client({
    _id: 'totals',
    data: []  
  });
}
Totals.prototype.init = function(){
  this.countTotals();
}
Totals.prototype.countTotals = function(){
  var that = this;

  async.parallel(
    [
      function(cb){
        Day.find().exec(function(err, count){
          that.dbDoc.data.push({
            type: 'days',
            count: count.length
          });
          cb();
        })
      },
      function(cb){
        User.find().exec(function(err, count){
          that.dbDoc.data.push({
            type: 'people',
            count: count.length
          });
          cb();
        })
      },
      function(cb){
        Message.find().exec(function(err, count){
          that.dbDoc.data.push({
            type: 'messages',
            count: count.length
          });
          cb();
        })
      },
      function(cb){
        Blob.find().exec(function(err, count){
          that.dbDoc.data.push({
            type: 'words',
            count: count.length
          });
          cb();
        })
      }
    ], 
    function(err){
      if (err) return console.log(err)

      // save to database
      that.dbDoc.save(function (err) {
        if (err) return console.log(err)
        console.log('totals counted');
      });
    }
  );
}



// Create word tree from blob data
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function Wordtree(){
  this.dbDoc = new Client({
    _id: 'word_tree',
    data: {
      count: null,
      range: null
    }
  })
  this.countMR = { // map reduce functions for counting each word from blobs
    map: function () { 
      var word = this.word[0].toLowerCase()
      emit( word , { count: 1 } );
    },
    reduce: function(key, values){
      var result = { count : 0 };
     
      values.forEach(function(value){
          result.count += value.count;
      })

      return result;
    }
  }
}
Wordtree.prototype.init = function(){
  this.countWords();
}
Wordtree.prototype.countWords = function(){
  var that = this;
  Blob.mapReduce(this.countMR, function (err, results) {
    if (err) console.log(err)
    var counts = [],
        range = {
          min: 100,
          max: 0
        };

    //clean up return object for D3, find min max of word counts
    for (var i = 0; i < results.length; i++) {
      if (results[i].value.count > 5 ){
        var obj = {}, 
            resultCount = results[i].value.count

        obj.name = results[i]._id,
        obj.size = resultCount
        counts.push(obj)

        if ( resultCount < range.min ) 
          range.min = resultCount;
        if ( resultCount > range.max ) 
          range.max = resultCount;
      }
    };

    //save return to database
    that.dbDoc.data = {
      count: counts,
      range: range
    }
    that.dbDoc.save(function (err) {
      if (err) return console.log(err)
      console.log('words counted');
    });
  });
}



// Get superlative rankings for each user
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function Rank(){
  this.people = User.find();
  this.rankings = [];
  this.days = {};
  this.startDate = null;
  this.totalDays = null;
  this.dbDoc = new Client({
    _id: 'rankings',
    data: null
  });
}
Rank.prototype.init = function(){
  var that = this;

  async.series(
    [
      function(cb){
        that.getStartDate(function(){
          cb();
        })
      },
      function(cb){
        //populate rankings with an object for each user
        that.people.exec(function(err,users){

          async.forEach(
            users,
            function(user, _cb){
              var obj = {
                  'name': user.name,
                  'posts': user.messages.length,
                  'avatar_url': user.avatar_url,
                  'type': user.type,
                  'created_at': user.created_at,
                  'verbosity': null,
                  'gifs': {},
                  'questions': {},
                  'selfs': {},
                  'curses': {},
                  'laughs': {}
                },
                messageCount = 0,
                culmLength = 0;

              // find verbosity of each user
              async.forEach(
                user.messages,
                function(messageId, __cb){
                  Message.findById(messageId, function(err, message){ // look up message from ID
                    if(err) console.log(err)
                    culmLength += message.body.length
                    messageCount++
                    __cb();
                  })
                }, 
                function(err){
                  obj.verbosity = Math.floor(culmLength / messageCount)
                  that.rankings.push(obj)
                  _cb();
                }
              );

            },
            function(err){
              cb();
            }
          );

        });
      },
      // rank number of questions
      function(cb){
        var regex = /\?/,
            nin = /http/;
        that.match('questions', regex, function(){cb();}, nin)
      },
      // rank number of gifs
      function(cb){
        var regex = /\.gif/;
        that.match('gifs', regex, function(){cb();})
      },
      // rank number of mentions of self
      function(cb){
        var regex = /\sI\s/;
        that.match('selfs', regex, function(){cb();})
      },
      // rank number of laughs
      function(cb){
        var regex = /\s(ha)+\s|lol|lmao/;
        that.match('laughs', regex, function(){cb();})
      },
      // rank number of curse words
      function(cb){
        var regex = /\sfuck|\sshit|\sdamn|\shell|\sass|\sjesus|\sdick|\spiss\sboner|\scunt|\sballs/;
        that.match('curses', regex, function(){cb();})
      }

    ],
    function(err){
      console.log(that.days)

      that.dbDoc.data = {
        people: that.rankings,
        days: that.days
      }
      that.dbDoc.save(function (err) {
        if (err) return console.log(err)
        console.log('rankings counted');
      });
    }
  );
}

Rank.prototype.match = function(attr, regex, cb, nin){
  var that = this,
      matchBody = {
        $regex: regex,
        $options: 'i' 
      };

  if(nin){
    matchBody.$nin = [ nin ] 
  }    

  //populate each user with their messages and parse
  this.people
    .populate({
      path:'messages',
      //find messages that use a '?' that isn't part of a URL
      match: { body: matchBody}
    })
    .exec(function(err, user){
    //count number of questions for each user returned
      async.forEach(
        user,
        function(user, cb){
          var u = user,
            obj = findObjectByAttr(that.rankings, 'name', u.name)
            days = [];

          obj[attr].count = u.messages.length;
          obj[attr].messages = [];

          for (var i = 0; i < u.messages.length; i++) {
            obj[attr].messages.push({
              'body': u.messages[i].body,
              'date': u.messages[i].date
            })

            var day = u.messages[i].date,
            obj2 = findObjectByAttr(days, 'date', day);

            if (obj2){
              obj2.count++
            } else {
              days.push({
                'date':day,
                'count':1
              });
            }

          };

          that.processDays(u.name, days, attr);

          cb();
        },
        function(err){
          if(err) return console.log(err)
          cb();
        }
      );
  });
}

Rank.prototype.getStartDate = function(cb){
  var startDate,
      that = this;   
  Day.find().exec(function(err, days){
    console.log('get start date')

    var lowest = Number.POSITIVE_INFINITY;
    var highest = Number.NEGATIVE_INFINITY;
    var tmp;
    for (var i=days.length-1; i>=0; i--) {
        tmp = days[i].date;
        if (tmp < lowest) lowest = tmp;
        if (tmp > highest) highest = tmp;
    }
    that.totalDays = days.length;
    that.startDate = lowest;
    cb();
  })  
}

Rank.prototype.processDays = function(name, days, attr){
  console.log('processDays')
  // console.log(data)

  var dateCounter = new Date(this.startDate),
      plotData = [];

  // console.log("start " + this.startDate + "  :  total" + this.totalDays)

  for (var z = 0; z < this.totalDays; z++) {
    var date = dateCounter;

    var obj = hasObjectWithValue(days, 'date', date)
    // console.log(user.name, date, obj)
    if (!obj){

      days.push({
        'date': String(date),
        'count':0
      });
    }

    var next = dateCounter.getDate() + 1
    dateCounter.setDate(next)

  };

  for (var j = 0; j < days.length; j++) {
    var dayObj = days[j];
    var name = String(name).replace(/\s+/g, '')
    var obj = {
      'key': name,
      'value': dayObj.count,
      'date': String(dayObj.date)
    }
    plotData.push(obj)
  };

  if (! this.days[attr]) this.days[attr] = []

  for (var i = 0; i < plotData.length; i++) {
    this.days[attr].push(plotData[i]);
  };
}


function Days(){
  this.dbDoc = new Client({
    _id: 'days',
    data: null
  })
}
Days.prototype.init = function(){
  var that = this;

  Day.find().exec(function(err, days){
    that.dbDoc.data = days
    that.dbDoc.save(function (err) {
      if (err) return console.log(err)
      console.log('days saved');
    });
  })

}


// run mining operations
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

console.log('mine started');

var totals = new Totals();
var wordTree = new Wordtree();
var rank = new Rank();
var days = new Days();

totals.init();
wordTree.init();
rank.init();
days.init();



// Utilities
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function findObjectByAttr(array, key, value){
  var obj;
  for (var i = 0; i < array.length; i++) {
    objVal = array[i][key];
    if (objVal == value) obj = array[i];
  };
  // console.log(obj)
  return obj;
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
