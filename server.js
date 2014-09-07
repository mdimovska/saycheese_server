var express = require("express");
var app = express();
var dbPath = 'mongodb://localhost/saycheese';
var bodyParser = require('body-parser');

var formidable = require('formidable'),
    http = require('http'),
    util = require('util');
// Import the data layer
var mongoose = require('mongoose');
// Import the models
var models = {
	User: require('./models/User')( mongoose ),
	Photo: require('./models/Photo')( mongoose )
};

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
mongoose.connect(dbPath, function onMongooseError(err) {
	if (err) throw err;
});
var fileupload = require('fileupload').createFileUpload('/uploadDir');


http.createServer(function(req, res) {
    /* Display the file upload form. */
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(
            '<form action="http://127.0.0.1:9000/upload" enctype="multipart/form-data" method="post">'+
            '<input type="text" name="title"><br>'+
            '<input type="file" name="upload" multiple="multiple"><br>'+
            '<input type="submit" value="Upload">'+
            '</form>'
    );

}).listen(8080);

app.get('/', function(req, res){
	//next();?????
});


app.post("/upload",function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        res.end(util.inspect({fields: fields, files: files}));
    });
    return;
});


//OK
/*
As long as a valid _id is provided, the registration process is allowed to proceed. 
Otherwise, error code 400 (Bad Request) is returned.
*/
/* x-www-form-urlencoded */
/*
POST /register HTTP/1.1
Host: localhost:8080
Cache-Control: no-cache
Content-Type: application/x-www-form-urlencoded

_id=1&fisrtName=Milena&lastName=Dimovska&pictureUrl=urlMilenaDimovska
*/
app.post('/register', function(req, res) {
	var _id = req.param('_id', null);
	var firstName = req.param('firstName', '');
	var lastName = req.param('lastName', '');
	var pictureUrl = req.param('pictureUrl', '');
	if ( null == _id || _id.length < 1 || _id == '') {
		res.send(400);
	}else{
		console.log('id: ', _id);
	 	console.log('firstName: ',firstName);
	 	console.log('lastName: ', lastName);
	 	console.log('pictureUrl: ', pictureUrl);
	 	models.User.findById(_id, function(user){
			if(user){
				console.log('user already registered');
				res.send(200);
			}
			else{
				models.User.register(_id, firstName, lastName, pictureUrl, function(success) {
					if ( !success ) {
						res.send(400);
					}else{
						res.send(200);
					}
				});
			}
		});
	}
});

//OK - not used!
app.post('/login', function(req, res) {
    console.log('login request');
    var _id = req.param('_id', null);
    if ( null == _id || _id.length < 1 ) {
        res.send(400);
        return;
    }
    models.User.login(_id, function(success) {
        if ( !success ) {
            res.send(400 );
        }else{
            console.log('login was successful');
            res.send(200);
        }
    });
});



//OK
//returns users
app.get('/users', function(req, res) { //404 if /users/
	models.User.findAllUsers(function(users) {
		if(users){
			res.send(users);
		}
		else {
			res.send(400);
		}
	});
});

//OK
//returns user info by userId   __v is redundant
app.get('/users/:id', function(req, res) { //404 if /users/
	var userId = req.params.id;
	models.User.findById(userId, function(user) {
		if(user){
			res.send(user);
		}
		else {
			res.send(400);
		}
	});
});



//OK
//add contact
app.post('/users/addContact', function(req,res) {
	//var userId = req.params.id;
	var userId = req.param('userId', null);
	var contactId = req.param('contactId', null);
	// Missing contactId, don't bother going any further
	if ( null == userId || userId == '' || null == contactId || contactId == '' ) {
		res.send(400);
	}else{
	  models.User.findById(userId, function(user) {
		if ( user ) {
			models.User.findById(contactId, function(contact) {
				if(!contact){
					res.send(400);
				}else{
					models.User.addContact(user, contact, function(success) {
						console.log('adding finished');
						if ( !success ) {
							res.send(400);
						}else{
							res.send(200);
						}
					});
				}
			});
		}
		else{
			res.send(400);
		}
	  });
	}
});


//OK
//remove contact or friend request...  //contact instead of removeContact!
app.post('/users/removeContact', function(req,res) {
	var userId = req.param('userId', null);
	var contactId = req.param('contactId', null);
	// Missing contactId, don't bother going any further
	if (  null == userId  || userId == '' || null == contactId  || contactId == '' ) {
		res.send(400);
	}
	else{
		models.User.findById(userId, function(user) {
		if ( user ) {
			models.User.findById(contactId, function(contact) {
				if(!contact){
					res.send(400);
				}else{
					models.User.removeContact(user, contact._id);
					models.User.removeContact(contact, user._id);
					res.send(200);
				}
			});
		}
		else{
			res.send(400);
		}
	  });
	}
});


//OK
//get friend requests
app.get('/users/:id/friendRequests', function(req, res) {
	var userId = req.params.id;
	
	models.User.findById(userId, function(user) {
		if ( user ) {
				var friends = [];
				user.contacts.forEach(function(contact) {
					if ( contact.status == 'requested' ) {
						friends.push(contact);
					}
				});
				res.send(friends);
		}
		else{
			res.send(400);
		}
	});
});

//OK
//accept friend
app.post('/users/:id/acceptFriend', function(req,res) {
	var userId = req.params.id; //requested
	var contactId = req.param('contactId', null); //pending
	// Missing contactId, don't bother going any further
	if (  null == userId  || userId == '' || null == contactId  || contactId == '' ) {
		res.send(400);
	}else{
	  models.User.findById(userId, function(user) {
		if ( user ) {
			models.User.findById(contactId, function(contact) {
				if(!contact){
					res.send(400);
				}else{
				  models.User.acceptFriend(user, contact, function(success) {
					if ( !success ) {
						res.send(400);
					}else{
					    res.send(200);
					}
				  });
				}
			});
		}
		else{
			res.send(400);
		}
  	});
  }
});


//OK
//get friends (status == 'friends')
app.get('/users/:id/contacts', function(req, res) {
	var userId = req.params.id;
	
	models.User.findById(userId, function(user) {
		if ( user ) {
				var friends = [];
				user.contacts.forEach(function(contact) {
					if ( contact.status == 'friends' ) {
						friends.push(contact);
					}
				});
				res.send(friends);
		}
		else{
			res.send(400);
		}
	});
});


//OK
//find friends (users that are not friends or pending)
app.post('/users/:id/findFriends', function(req, res) {
	var userId = req.params.id;
	var fbContacts = req.param('fbContacts', null); //list of ids of user's fb friends in form:   id1 id2 id3 id4
	models.User.findById(userId, function(user) {
		if ( user ) {
			models.User.findFacebookFriends(user, fbContacts, function(users){
				res.send(users);
			});	
		}
		else{
			res.send(400);
		}
	});
});

// ============================== PHOTOS ============================== //

//OK
//add photo
app.post('/photos/photo', function(req, res) {
	console.log('add photo request');
	var userId = req.param('userId', null);
	var firstName = req.param('firstName', null);
	var lastName = req.param('lastName', null);
	var photoUrl = req.param('photoUrl', null);
	var caption = req.param('caption', null);
	if ( null == userId || userId.length < 1 || userId == '' ||  null == photoUrl || photoUrl.length < 1 || photoUrl == '' ) {
		res.send(400);
	}else{
	  models.Photo.addPhoto(userId, firstName, lastName, photoUrl, caption, function(success) {
		if ( !success ) {
			res.send(400);
		}else{
			res.send(200);
		}
	  });
	}
});

//OK
//delete photo
app.delete('/photos/photo', function(req,res) {
	var photoId = req.param('photoId', null);
	// Missing photoId, don't bother going any further
	if ( null == photoId || photoId == '') {
		res.send(400);
	}else{
	  models.Photo.findById(photoId, function(photo) {
		if ( !photo ){
			res.send(400);
		}else{
		  models.Photo.removePhoto(photo, function(success){
			if ( !success ) {
				res.send(400);
			}else{
			  res.send(200);
			}
		  }); 
		}
	  });
	}
});

//OK
//get user's photos    //if only /photos/ 404 Not Found error 
// if wrong id (id that do not exists in db), returns []
app.get('/photos/:id', function(req, res) {
	var userId = req.params.id;
	models.Photo.getUserPhotos(userId, function(photos) {
		res.send(photos);
	});
});

//OK
//get all photos from database
app.get('/photos/', function(req, res) {
	models.Photo.getAllPhotos(function(photos) {
		res.send(photos);
	});
});

//OK
//get photos of user's friends
app.get('/photos/:id/latest', function(req, res) {
	var userId = req.params.id;
	
	models.User.findById(userId, function(user) {
		if ( user ) {
				var friendsList = []; //list of ids of user's friends
				user.contacts.forEach(function(contact) {
					if ( contact.status == 'friends' ) {
						friendsList.push(contact.userId);
					}
				});			
			
				models.Photo.getPhotosByUsers(friendsList, function(photos) {
					res.send(photos);
				});	
		}
		else{
			res.send(400);
		}
	});
});	


//OK
//add comment
app.post('/photos/comment', function(req,res) {
	var userId = req.param('userId', null);
	var photoId = req.param('photoId', null);
	var firstName = req.param('firstName', null);
	var lastName = req.param('lastName', null);
	var comment = req.param('comment', null);
	
	// Missing contactId, don't bother going any further
	if ( null == userId || userId == '' || null == comment || comment == '' ||  null == photoId || photoId == ''  ) {
		res.send(400);
	}else{
	  models.Photo.findById(photoId, function(photo) {
		if ( photo ) {
				models.Photo.addComment(photo, userId, firstName, lastName, comment , function(success) {
					if ( !success ) {
						res.send(400);
					}else{
						res.send(200);
					}
				});
		}
		else{
			res.send(400);
		}
	  });
	}
});

//OK
//add like (or remove like if exists)
app.post('/photos/like', function(req,res) {
	var userId = req.param('userId', null);
	var photoId = req.param('photoId', null);
	var firstName = req.param('firstName', null);
	var lastName = req.param('lastName', null);
	
	// Missing contactId, don't bother going any further
	if ( null == userId || userId == '' || null == photoId || photoId == '') {
		res.send(400);
	}else{
	  models.Photo.findById(photoId, function(photo, err) {
		if ( photo ) {
				models.Photo.addOrRemoveLike(photo, userId, firstName, lastName , function(success) {
					if ( !success ) {
						res.send(400);
					}else{
						res.send(200);
					}
				});
		}else{
			res.send(400);
		}
	  });
	}
});

app.listen(9000);
console.log('Listening on port 9000');