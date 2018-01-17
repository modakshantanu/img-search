// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongodb = require("mongodb");

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


let response_handler = function (response) {
    let body = '';
    response.on('data', function (d) {
        body += d;
    });
    response.on('end', function () {
        body = JSON.parse(body);
        k = body.value;
    });
    response.on('error', function (e) {
        console.log('Error: ' + e.message);
    });
};

let bing_web_search = function (search) {
 
  let request_params = {
        method : 'GET',
        hostname : host,
        path : path + '?q=' + encodeURIComponent(search),
        headers : {
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
    };

    let req = https.request(request_params, response_handler);
    req.end();
}



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
