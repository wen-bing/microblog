var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');

module.exports = function(app){

	/**
	* Handle Error & Session.
	*/
	app.use(function(req, res, next){
	  var err = req.session.error;
	  var msg = req.session.success;
	  var user = req.session.user;
	  delete req.session.error;
	  delete req.session.success;

	  //initialize the local parameters in template
	  res.locals.error = null;
	  res.locals.success = null;
	  res.locals.message = '';
	  res.locals.user = null;

	  if (err) {
	    res.locals.error = err;
	    res.locals.message =  err;
	  }
	  if (msg) {
	    res.locals.success = msg;
	    res.locals.message = msg;
	  }
	  if(user)
	    res.locals.user = user;

	  //pass the request to route
	  next();
	});

	//HOME 
	app.get('/', function(req, res){
		//display all the posts on the home page
		Post.getAll(function(err, posts){
			if(err){
				posts=[];
			}
			res.render('index', { title: 'Microblog', posts : posts});
		});
	});

	//Handle /reg
	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res){
		res.render('reg', {title: "Microblog - Register"});
	});
	app.post("/reg", checkNotLogin);
	app.post('/reg', function(req, res){
		//check two passwords
		if(req.body['password-repeat'] != req.body['password']){
			req.session.error = "Two passwords cannot match";
			return res.redirect('/reg');
		}

		//not store password directly, hash value instead.
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');

		var newUser = new User({
			name: req.body['username'],
			password: password,
		});


		User.get(newUser.name, function(err, user){
			if(user){
				err = "User name already exists!";
			}

			if(err){
				req.session.error = err;
				return res.redirect('/reg');
			}else{
				newUser.save(function(err){
					if(err){
						req.session.error="Save User error";
						return req.redirect('/reg');
					}

					//store user to session
					req.session.user = newUser;
					req.session.success = "Register Succeed";
					res.redirect('/');
				});
			}
		});
	});

	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {title:"User Login"});
	});
	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res){
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');

		User.get(req.body.username, function(err, user){
			if(!user){
				req.session.error = "User doesn't exist";
				return res.redirect('/login');
			}

			if(user.password != password){
				req.session.error = "Password Error";
				return res.redirect('/login');
			}

			req.session.user = user;
			req.session.success ="Login success";
			res.redirect('/');
		});
	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.session.success = "logout success";
		res.redirect("/");
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		if(req.body.post.length == 0){
			req.session.error = "Cannot post empty post";
			res.redirect("back");
		}
		var user = req.session.user;
		var post = new Post(user.name, req.body.post);
		post.save(function(err){
			if(err){
				req.session.error=err;
				return res.redirect('/');
			}
			req.session.success="Post Succeed";
			res.redirect('/u/'+user.name);
		})
	});

	app.get('/u/:user', function(req, res) {
		User.get(req.params.user, function(err, user){
			if(!user){
				req.session.error="User doesn't exist";
				return res.redirect('/');
			}

			Post.getByUser(user.name, function(err, posts){
				if(err){
					req.session.error=err;
					return res.redirect('/');
				}
				res.render('user', {title: user.name, posts:posts});
			});
		});
	});
};

function checkNotLogin(req, res, next){
	if(req.session.user){
		req.session.error="You're already loged in.";
		return res.redirect('/');
	}
	next();
}

function checkLogin(req, res, next){
	if(req.session.user){
		next();
	}else{
		req.session.error="You haven't login";
		return res.redirect('/login');
	}
}