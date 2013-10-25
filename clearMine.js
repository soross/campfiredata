var db = require("./db").db;

db.collections['clients'].drop(function(err) {
   console.log('collection dropped');
});
