var db = require("./db").db;

db.collections['days'].drop(function(err) {
   console.log('collection dropped');
});
db.collections['users'].drop(function(err) {
   console.log('collection dropped');
});
db.collections['messages'].drop(function(err) {
   console.log('collection dropped');
});
db.collections['blobs'].drop(function(err) {
   console.log('collection dropped');
});
