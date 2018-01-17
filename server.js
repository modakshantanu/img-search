// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var dburl = "mongodb://"+process.env.USER+":"+process.env.PASSWORD+"@ds259117.mlab.com:59117/img-search";

'use strict';

let https = require('https');

// **********************************************
// *** Update or verify the following values. ***
// **********************************************

// Replace the subscriptionKey string value with your valid subscription key.
let subscriptionKey = process.env.KEY;

// Verify the endpoint URI.  At this writing, only one endpoint is used for Bing
// search APIs.  In the future, regional endpoints may be available.  If you
// encounter unexpected authorization errors, double-check this host against
// the endpoint for your Bing Web search instance in your Azure dashboard.
let host = 'api.cognitive.microsoft.com';
let path = '/bing/v7.0/images/search';
var k;







app.get("/recents",function(req,res){
  
  MongoClient.connect(dburl,function(err,parentDB){
    if(err)console.log("err");else{
      
      var db= parentDB.db("img-search");
      var recentCollection = db.collection("recent-searches");
      
      recentCollection.find().toArray(function(err,result){
        if(err)return;
        
        
        if(result[0].recents){
           res.end(JSON.stringify(result[0].recents)); 
        }else
          res.end("No records found");
        
      
      
      })
      
      
      
      
    }
    
  });
  
  
  
});


app.get('/search/:query',function(req,resp){
  var query = req.params.query;
  var offset = req.query.offset||0;

  var request_params = {
        method : 'GET',
        hostname : host,
        path : path + '?count=10&q=' + query+"&offset="+offset,
        headers : {
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
    };

  var req = https.request(request_params, function(response){
    
    let body = '';
    response.on('data', function (d) {
        body += d;
    });
    response.on('end', function () {
        body = JSON.parse(body);
        k = body.value;
      
      var result = "";
        for(var i=0;i<body.value.length;i++){
          var temp = {
            "page_url":body.value[i].hostPageUrl,
            "alt":body.value[i].name,
            "content_url":body.value[i].webSearchUrl
          }  
          result+=JSON.stringify(temp);
          result+="\n";
          
        }
      
        var queryobj = {
          "term":query,
          "time":new Date().toString()
        }
        
        
        
        MongoClient.connect(dburl,function(err,parentDB){
          
          if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
          } else {
            console.log('Connection established to', dburl);
            
            var db=parentDB.db("img-search");
            var recentCollection = db.collection("recent-searches");
            var recentCursor = recentCollection.find();
            recentCursor.toArray(function(err,arr){
              if(err) throw err;
              if(arr.length==0||arr[0].recents.length==0){
                
                
                recentCollection.insert(
                  {
                  "recents":[queryobj]  
                  }
                );
                
                
              }else{
                var oldRecents = arr[0].recents;
                
               
                oldRecents.unshift(queryobj);
               
                if(oldRecents.length>5)
                  oldRecents.pop();
            
                
                
                
                recentCollection.update({},{"recents":oldRecents});
                  
                
                
              }


              
            });
            
          }
          
        });
      
      
      
        resp.end(result);
    });
    response.on('error', function (e) {
        console.log('Error: ' + e.message);
    });
  });
    
  
  req.end();
  
})


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
