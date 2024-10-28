const mongoose = require('mongoose');
const postSchema = mongoose.Schema({
    caption:{type:'String',required:true},
    image:{type:'String'},
    username:{type:'String',required:true},
    userId:{type:'String',required:true},
    profilePic:{type:'String',required:true},
    likes:{type:'Number',default:0},
    likedBy:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],

    comments:[{
        userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
        text:{type:'String',required:true},
        createdAt:{type:Date,default:Date.now},
        username:{type:'String',required:true},
        profilePic:{type:'String',required:true} 
    }]
},{timestamps:true})
const post = mongoose.model('Post', postSchema);
module.exports = post
