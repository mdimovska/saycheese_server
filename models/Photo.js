module.exports = function(mongoose) {

	var Comment = new mongoose.Schema({
		userId: { type: String },
		firstName: { type: String },
		lastName: { type: String },
		comment: { type: String },
		date: { type: Date } // When the comment was added
	});
	
	var Like = new mongoose.Schema({
		userId: { type: String },
		firstName: { type: String },
		lastName: { type: String },
		date: { type: Date } // When the like was added
	});

	var PhotoSchema = new mongoose.Schema({
		userId: { type: String },		
		firstName: { type: String }, //
		lastName: { type: String }, //
		photoUrl: { type: String },
		caption: { type: String },
		dateTaken: { type: Date },
		removed: {type: String}, //0-not removed, 1-removed
		comments: [Comment],
		likes: [Like]
	});

	var Photo = mongoose.model('Photo', PhotoSchema);
	
	//OK
	var addPhoto = function(userId, firstName, lastName, photoUrl, caption, callback) {
		var photo = new Photo({
 			firstName: firstName,
			lastName: lastName,
			photoUrl: photoUrl,
			caption: caption,
			dateTaken: new Date(),
			removed: 0
		});
		photo.save(function(err) {
			if (err) {
				callback(false);
				console.log('Error adding the photo: ' + err);
			}else{
				callback(true);
				console.log('Photo was added');
			}
		});
	}
	
	//OK (photo is not deleted from db.. only the flag 'removed' is set to '1' (1 means deleted)
	var removePhoto = function(photo, callback) {
		if ( null == photo ) return;
		photo.removed ="1";
		photo.save(function(err) {
				if (err) {
					callback(false);
					console.log('Error deleting the photo: ' + err);
				}else{
					callback(true);
					console.log('Photo was deleted');
				}
			});
	}
	
	//OK
	var findById = function(photoId, callback) {
		Photo.findOne({_id:photoId}, function(err,doc) {
			callback(doc);
		});
	}	

	//OK
	var getUserPhotos = function(userId, callback) {
		Photo.find({userId:userId, removed: "0"}, {userId:0, firstName:0, lastName:0}, {sort: {dateTaken: -1}}, function(err,doc) { //check
			callback(doc);
		});
	}	
	//returns:
	/*
	[
		 {
			"_id": "53ff492d49aa9e681b000004",
			"photoUrl": "urllllllllllllllll",
			"caption": "captionnnnnnnnnn",
			"dateTaken": "2014-08-28T15:22:21.220Z",
			"removed": "0",
			"__v": 0,
			"likes": [],
			"comments": []
		},
		...
	]
	*/
	
	//OK
	var getAllPhotos = function(callback) {
		Photo.find({}, {},  {sort: {dateTaken: -1}}, function(err,doc) { //check
			callback(doc);
		});
	}	
	
	//OK
	var getPhotosByUsers = function(usersIdArray, callback) { //users = id1 id2 ... 
		Photo.find( {userId : {$in : usersIdArray }}, {} , {sort: {dateTaken: -1}} , function(err,result) {
			callback(result);
		});
	}
	
	//OK
	var addComment = function( photo, userId, firstName, lastName, comment, callback ) {
		var newComment = {
			userId: userId,
			firstName: firstName,
			lastName: lastName,
			comment: comment,
			date: new Date()
		};
		photo.comments.push(newComment);
		photo.save(function (err) {
			if (err) {
				console.log('Error adding a comment: ' + err);
				callback(false);
			}else{
				console.log('Comment was added');
				callback(true);
			}
		});
	};
	
	//OK
	var addOrRemoveLike = function( photo, userId, firstName, lastName, callback ) {
		var newLike = {
			userId: userId,
			firstName: firstName,
			lastName: lastName,
			date: new Date()
		};
		var hasLikeFromUser = false;
		if ( null != photo.likes ){
			photo.likes.forEach(function(like) {
				if ( like.userId == userId ) {
					hasLikeFromUser = true;
					photo.likes.remove(like);
					console.log('Like was removed');
					photo.save();
				}
			});
		}
		if(!hasLikeFromUser){
			photo.likes.push(newLike);
			photo.save(function (err) {
				if (err) {
					console.log('Error adding like: ' + err);
					callback(false);
				}else{
					console.log('Like was added');
					callback(true);
				}
			});
		}else{
			callback(true);
		}
	};
	
	return {
		findById: findById,
		addPhoto: addPhoto,
		removePhoto: removePhoto,
		getUserPhotos: getUserPhotos,
		getPhotosByUsers: getPhotosByUsers,
		addComment: addComment,
		addOrRemoveLike: addOrRemoveLike,
		getAllPhotos: getAllPhotos,
		Photo: Photo
	}
}