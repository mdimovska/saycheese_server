/*
The account model is the main point of contact between Node.js and the MongoDB
database.
The account model in Example 6-1 includes database fields for an email address, password,
name, photo, description, and biography. This is a CommonJS module, which
exports the account and register, forgotPassword, changePassword, and login
functions.
*/
module.exports = function(mongoose) {

	var Contact = new mongoose.Schema({
		userId: { type: String },		
		firstName: { type: String },
		lastName: { type: String },
		pictureUrl: { type: String },
		dateAdded: { type: Date }, // When the contact was added
		status: { type: String }
	});

	var UserSchema = new mongoose.Schema({
		_id: { type: String, unique: true },
		firstName: { type: String },
		lastName: { type: String },
		pictureUrl: { type: String },
		contacts: [Contact]
	});

	var User = mongoose.model('User', UserSchema);

	//OK
	var login = function(_id, callback) {
		User.findOne({_id:_id},function(err,doc){
			callback(null!=doc);
		});
	};

	//OK
	var findById = function(accountId, callback) {
		User.findOne({_id:accountId}, function(err,doc) {
			callback(doc);
		});
	}	
	
	
	//OK
	var register = function(_id, firstName, lastName, pictureUrl, callback) {
		console.log('Registering ' + _id);
		var user = new User({
			_id: _id,
			firstName: firstName,
			lastName: lastName,
			pictureUrl: pictureUrl
		});
		user.save(function(err) {
				if (err) {					
					console.log('Error while registering: ' + err);
					callback(false);
				}else{
					console.log('registering was successful');
					callback(true);
				}
		});
	}
	
	//OK
	//user sends friend request to user1.. user's status is 'pending', user1's status is 'requested'
	var addContact = function(user, user1, callback) {
		var date = new Date();
		var contact = {
			userId: user1._id,
			firstName: user1.firstName,
			lastName: user1.lastName,
			pictureUrl: user1.pictureUrl,
			dateAdded: date,
			status:'pending'
		};
		var contact1 = {
			userId: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
			dateAdded: date,
			pictureUrl: user.pictureUrl,
			status:'requested'
		};
		//user.contacts = []; //delete contacts
		//user1.contacts = []; //delete contacts
		//are friends or request already sent..
		
		var areFriends = false;
		user.contacts.forEach(function(userContact) {
			if ( userContact.userId == user1._id ) {
				areFriends = true; //how to BREAK the loop????
			}
		});
		
		//this prevents from sending two or more same friend requests
		if(areFriends){
			console.log('users are already friends or request has been sent');
			callback(false);
			return;
		}
			
		user.contacts.push(contact);
		user.save(function (err) {
			if (err) {
				console.log('Error saving account 1: ' + err);
				callback(false);
			}
			else{
				user1.contacts.push(contact1);
				user1.save(function (err) {
					if (err) {
						user.contacts.remove(contact); //CHECK!
						console.log('Error saving account: ' + err);
						callback(false);
					}
					else{
						callback(true);
					}
				});
			}
		});
	};

	//OK
	var removeContact = function(user, contactId) {
		if ( null == user.contacts ) return;
		user.contacts.forEach(function(contact) {
			if ( contact.userId == contactId ) {
				user.contacts.remove(contact);
				user.save();
				return;
			}
		});
	};
	
	
//OK, 
//but need to change!
var acceptFriend = function(user, user1, callback) {
//TODO:
//change this function!
		var date = new Date();
		var contact = {
			userId: user1._id,
			firstName: user1.firstName,
			lastName: user1.lastName,
			pictureUrl: user1.pictureUrl,
			dateAdded: date,
			status:'friends'
		};
		var contact1 = {
			userId: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
			pictureUrl: user.pictureUrl,
			dateAdded: date,
			status:'friends'
		};
		
		var areFriends = false;
		
		user.contacts.forEach(function(userContact) {
			if ( userContact.userId == user1._id ) {
				if(userContact.status != 'requested') 
					//user.status should be 'requested', user1.status should be 'pending'
					areFriends = false;
				else{
					areFriends = true;
					user.contacts.remove(userContact);
					user.save();
				}
			}
		});
		
		if(!areFriends){
			callback(false); //to prevent accepting when request is not send
			return;
		}
		
		user1.contacts.forEach(function(userContact1) {
			if ( userContact1.userId == user._id ) {
				user1.contacts.remove(userContact1);
				user1.save();
			}
		});
		user.contacts.push(contact);
		user1.contacts.push(contact1);
		user.save();
		user1.save();
		callback(true);
		
		//TODO: CHANGE THIS!
		
		/*
		user.save(function (err) {
			if (err) {
				console.log('Error accepting friend request: ' + err);
				callback(false);
			}
			else{
				user1.save(function (err) {
					if (err) {
						console.log('Error accepting friend request: ' + err);
						//user.contacts.remove(contact); //CHECK!
						callback(false);
					}
					else{
						callback(true);
					}
				});
			}
		});
		*/
};

	//OK
	//return users that are not in user's contacts
	var findFriendsToAdd = function(user, arrayUsers, callback){
		User.find({_id:{$in : arrayUsers }}, {},  {sort: [['firstName', 1], ['lastName', 1]]}, function(err,resUsers) { //check
			var users = [];
			if(resUsers!=null){
				resUsers.forEach (function (user1){
					var areFriends = false;
					
					//check if user1 is friend with user (or friend request is sent)
					user1.contacts.forEach(function(contact) {
						if ( contact.userId == user._id ) {
							areFriends = true;
							//TODO: BREAK!
						}
					});
					if(!areFriends){
					  var userToAdd = {
						userId: user1._id,
						firstName: user1.firstName,
						lastName: user1.lastName,
						pictureUrl: user1.pictureUrl
					  };
						users.push(userToAdd);
					}
				});
			}
		    callback(users);
		});
	}
	
	//OK
	//return facebook friends that are not contacts in saycheese (and friend requests that the user sent)
	var findFacebookFriends = function(user, userIdList,callback) {
		//find fb friends that have account on saycheese
		var users = [];
		
		var arrayUsers = userIdList.split(" "); //input is in form:    1 2 3  where 1 2 or 3 is id of user
		
		findFriendsToAdd(user, arrayUsers, function (friendsToAdd){ //return users that are not friends with user
			var pending = [];
			user.contacts.forEach(function(contact) {
				if ( contact.status == 'pending' ) {
					pending.push(contact);
				}
			});
			result = {
				"add" : friendsToAdd,
				"pending" : pending		
			};
			callback(result);
		});	
	}
	
	var findAllUsers = function(callback){
		User.find({}, function(err,resUsers) {
			callback(resUsers);
		});
	}
	
	return {
		login: login,
		findById: findById,
		register: register,
		findAllUsers: findAllUsers,
		addContact: addContact,
		acceptFriend: acceptFriend,
		removeContact: removeContact,
		findFacebookFriends: findFacebookFriends,
		findFriendsToAdd: findFriendsToAdd, //this one is not called directly
		User: User
	}
}