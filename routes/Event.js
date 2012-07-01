(function(){
  var _     = require("underscore"),
     async  = require("async"),
     Ordrin = require("ordrin-api"),
     config = require('nconf').argv().env().file({file:'./config.json'});

  var handler,
      https = require('https'), options,
      params;

  handler = function(req, res, next){
    var ordrin = req._ordrin;
    var eid = req.params.eid;
    options = {
        host : "api.meetup.com",
        port : 443,
        path : "/2/event/",
        method : 'GET'
    };

    options.path += eid + "?key=" + config.get("meetup_api_key") + "&sign=true";
    console.log(options);
    var meetupReq = https.request(options, function(resp) {
      params = {};

      if(resp.statusCode > 400) {
        next(404);
      } else {
        resp.on('data', function(d) {
          eventInfo = JSON.parse(d);
          params = _.extend({
            title: eventInfo.name, 
            eventId: eid, 
            event_name: eventInfo.name,
            event_url: eventInfo.event_url,
            header: true
           }, eventInfo);

          var timestamp = (parseInt(eventInfo.time) + parseInt(eventInfo.utc_offset));
          var dateTime = new Date(timestamp);
          // add stuff to session for later. Sorry Felix
          req.session.meetup = {
            name: eventInfo.name,
            event_url: eventInfo.event_url,
            address: eventInfo.venue,
            dateTime: dateTime
          };

          console.log(dateTime);
          var address = new ordrin.Address(eventInfo.venue.address_1, eventInfo.venue.city, eventInfo.venue.state, eventInfo.venue.zip, '7187533087');
          ordrin.restaurant.getDeliveryList(dateTime, address, function(err, data) {
            params.restaurants = data;
            res.render("Event/index.jade", params);
          });
        });
      }
    });
    meetupReq.end();
    
    /*ordrin.restaurant.getDetails(req.params.rid, function(err, data){
      if (err){
        console.log("fuck", err);
        next(500, err);
        return;
      }
      var params = _.extend({title: data.name}, data);
      res.render("Menu/index.jade", params);
    });*/
    //res.render();
  }

  module.exports = handler;
})();
