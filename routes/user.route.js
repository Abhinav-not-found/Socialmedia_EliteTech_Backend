const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Welcome route
router.get('/', (req, res) => {
    res.json({ message: "Welcome to Instaloop API" });
});

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ensure default values for followers and following arrays
        const newUser = new userModel({
            username,
            email,
            password: hashedPassword,
            fullName,
            followers: [],  // Initialize followers as an empty array
            following: []   // Initialize following as an empty array
        });

        // Save user to database
        await newUser.save();

        // Respond with success message
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        return res.status(500).json({ message: 'Server Side Error', error: error.message });
    }
});


// Login route
router.post('/login',async(req, res)=>{
    try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email: email });
    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Generate JWT token
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ token:token,userId: user._id});
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    }
    else{
        return res.status(404).json({ message: 'User not found' });
    }
    } catch (error) {
        return res.status(500).json({ message: 'Server Side Error', error: error.message });
    }
})

// Get profile
router.get('/profile/:id', async(req, res)=>{
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        if(user){
            res.status(200).json(user);
        }else{
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Server Side Error', error: error.message });
    }
})
//get specific profile
router.get('/specificProfile/:username', async(req, res)=>{
    try {
        const { username } = req.params;
        const user = await userModel.findOne({username: username});
        if(user){
            res.status(200).json(user);
        }else{
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Server Side Error', error: error.message });
    }
})

// Follow user
router.put('/follow/:id', async (req, res) => {
    try {
        const { id } = req.params; // id of the user to be followed
        const userId = req.body.userId; // id of the user who is following

        // Add the follower to the user's followers array
        const followersUpdate = await userModel.findByIdAndUpdate(
            id, 
            { $addToSet: { followers: userId } }, // Use $addToSet to ensure uniqueness
            { new: true }
        );
        
        // Add the user to the following array of the follower
        const followingUpdate = await userModel.findByIdAndUpdate(
            userId, 
            { $addToSet: { following: id } }, // Use $addToSet to ensure uniqueness
            { new: true }
        );
        
        if (followersUpdate && followingUpdate) {
            res.status(200).json({ message: 'Follow successful' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Server Side Error', error: error.message });
    }
});


// Unfollow user
router.put('/unfollow/:id', async (req, res) => {
    try {
        const { id } = req.params; // id of the user to be unfollowed
        const userId = req.body.userId; // id of the user who is unfollowing

        // Remove the follower from the user's followers array
        const followersUpdate = await userModel.findByIdAndUpdate(
            id, 
            { $pull: { followers: userId } }, // Use $pull to remove the user
            { new: true }
        );

        // Remove the user from the following array of the follower
        const followingUpdate = await userModel.findByIdAndUpdate(
            userId, 
            { $pull: { following: id } }, // Use $pull to remove the follow
            { new: true }
        );
        
        if (followersUpdate && followingUpdate) {
            res.status(200).json({ message: 'Unfollow successful' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Server Side Error', error: error.message });
    }
});


//saving bio
router.put('/bio/:id', async(req, res)=>{
    try {
        const { id } = req.params;
        const bio = req.body.bio;
        const username = req.body.username;
        const userUpdate = await userModel.findByIdAndUpdate(id, {bio: bio,username:username}, {new: true});
        if(userUpdate){
            res.status(200).json({message:'Bio updated'});
        } else{
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Server Side Error', error: error.message });
    }
})
module.exports = router;
