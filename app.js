
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 4000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  //enable midleware layer
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  //handle HTTP verb
  app.use(express.methodOverride());
  //cookie & session
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  //app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));

  //set static server
  app.use(express.static(path.join(__dirname, 'public')));
});

//environment
app.configure('development', function(){
  app.use(express.errorHandler());
});

//Set routes/controller
var routes = require('./routes')(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
