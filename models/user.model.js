const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: '' },
    bio: { type: String, default: '' },
    savedPosts: { type: [String], default: [] },
    followers: { type: [String], default: [] }, // Removed unique: true
    following: { type: [String], default: [] }  // Removed unique: true
});

const user = mongoose.model('User', userSchema);
module.exports = user;
