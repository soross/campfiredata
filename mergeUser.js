var async = require("async");
var User = require("./db").User;


User.find({'name':'JC Ford'}, function(err, res){
  var a,b,c;


  a = res[0]
  b = res[1]
  c = mergeObjects(b, a)


  async.parallel(
    [
      function(cb){
        a.remove(function (err, model) {
          if (err) return handleError(err);
          cb()
        });
      },
      function(cb){
        b.remove(function (err, model) {
          if (err) return handleError(err);
          cb()
        });
      },
      function(cb){
        c.save(function (err, model) {
          if (err) return handleError(err);
          cb()
        });
      }
    ], 
    function(err){
      if(err) return console.log(err)
      console.log('merge complete')
    }
  )

})


function mergeObjects(a,b) {
    res = new Object();

    for (attr in a) 
          res[attr] = a[attr];
    for (attr in b)
          res[attr] = b[attr];

    // only if you wanna save it in a document again
    // delete res["_id"];
    return res;
 }