const express = require('express')
const router = express.Router()
const userModel = require('../models/user.model')
const postModel = require('../models/post.model')
const multer = require('multer');
const cloudinary = require('../config/cloudinary.config'); 



const storage = multer.memoryStorage();
const upload = multer({ storage });



router.get('/', function (req, res){
    res.json({ message: "Welcome to post routes" });
})
router.post('/create', upload.single('file'), async (req, res) => {
    const { caption, username, profilePic, userId } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // 1. Create the post in the database with no image yet
        const newPost = new postModel({
            caption: caption,
            image: '', // Placeholder for now, image URL will be updated later
            username: username,
            userId:userId,
            profilePic: profilePic,
        });

        const savedPost = await newPost.save(); // This gives us the postId

        // 2. Upload the image to Cloudinary with the postId in the filename
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                public_id: `post_${savedPost._id}`, // Name the file as 'post_<postId>'
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary error:', error);
                    return res.status(500).json({ message: 'Cloudinary upload error', error: error.message });
                }

                // 3. Get the Cloudinary URL
                const imageUrl = result.secure_url;

                // 4. Update the post in the database with the image URL
                savedPost.image = imageUrl;
                const updatedPost = await savedPost.save();

                // Send a successful response with the updated post
                res.status(200).json(updatedPost);
            }
        );

        // Ensure the file buffer is passed to Cloudinary
        uploadStream.end(req.file.buffer);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.get('/getAllPosts', async(req, res)=>{
    try {
        const allPosts = await postModel.find({});
        res.status(200).json(allPosts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
})
//delete post
router.delete('/delete/:id', async(req, res)=>{
    try {
        const post = await postModel.findByIdAndDelete(req.params.id);
        if(!post){
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}); 

//save post
router.post('/savePost', async (req, res) => {
    try {
        const { postId, userId } = req.body;

        // Find the user by ID
        const findCurrentUser = await userModel.findById(userId);
        
        if (findCurrentUser) {
            // Add the postId to the savedPosts array if it's not already there
            if (!findCurrentUser.savedPosts.includes(postId)) {
                findCurrentUser.savedPosts.push(postId); // Add postId to savedPosts array
                await findCurrentUser.save(); // Save changes to the database
            }
            res.json({ message: 'Post saved successfully', savedPosts: findCurrentUser.savedPosts });
        } else {
            res.status(404).send('User Not Found');
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

//get saved posts
router.get('/getSavedPosts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user by ID
        const findCurrentUser = await userModel.findById(userId);

        if (findCurrentUser) {
            // Find the posts with the savedPost IDs
            const savedPosts = findCurrentUser.savedPosts
            res.json(savedPosts);
        } else {
            res.status(404).send('User Not Found');
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
// getting post in saved section 
router.get('/getPostById/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await postModel.findById(postId);

        if (post) {
            res.json(post); // Return the post data
        } else {
            res.status(404).send('Post Not Found');
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


//get post number for specific profile page
router.get('/getPostCount/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const postCount = await postModel.countDocuments({ username });
        const findPosts = await postModel.find({username: username});
        res.json({ postCount, findPosts });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

//UnSave the post
// Change the route to use DELETE
router.delete('/unSavePost', async (req, res) => {
    try {
        const { postId, userId } = req.body;

        // Input validation
        if (!postId || !userId) {
            return res.status(400).json({ message: 'postId and userId are required' });
        }

        // Find the user by ID
        const findCurrentUser = await userModel.findById(userId);
        
        if (findCurrentUser) {
            // Check if postId exists in savedPosts
            const index = findCurrentUser.savedPosts.indexOf(postId);
            if (index === -1) {
                return res.status(400).json({ message: 'Post not saved' });
            }
            
            // Remove the postId from the savedPosts array
            findCurrentUser.savedPosts.splice(index, 1);
            await findCurrentUser.save(); // Save changes to the database

            res.json({ message: 'Post unsaved successfully', savedPosts: findCurrentUser.savedPosts });
        } else {
            res.status(404).send('User Not Found');
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.put('/likePost', async (req, res) => {
    try {
        const { postId, userId, like } = req.body;  // Accept "like" as a boolean along with postId and userId

        // Input validation
        if (!postId || !userId || typeof like !== 'boolean') {
            return res.status(400).json({ message: 'postId, userId, and like status are required' });
        }

        // Find the post by ID
        const findPost = await postModel.findById(postId);

        if (!findPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Update the likedBy array and the likes count based on the "like" boolean
        if (like) {
            // Check if the user has already liked the post
            if (!findPost.likedBy.includes(userId)) {
                findPost.likedBy.push(userId);  // Add userId to likedBy array
                findPost.likes += 1;            // Increment the likes count
            } else {
                return res.status(400).json({ message: 'User has already liked the post' });
            }
        } else {
            // Check if the user has already liked the post to allow unliking
            if (findPost.likedBy.includes(userId)) {
                // Remove userId from likedBy array
                findPost.likedBy = findPost.likedBy.filter(id => id.toString() !== userId.toString());
                findPost.likes = Math.max(0, findPost.likes - 1);  // Decrement the likes count, ensuring no negative likes
            } else {
                return res.status(400).json({ message: 'User has not liked the post yet' });
            }
        }

        // Save the updated post
        await findPost.save();

        // Respond with the updated likes count
        res.json({
            message: like ? 'Post liked successfully' : 'Post unliked successfully',
            likes: findPost.likes,  // Return updated likes count
            likedBy: findPost.likedBy  // Return updated likedBy array
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


router.post('/comment', async (req, res) => {
    try {
        const { postId, userId, text } = req.body;

        // Validate input
        if (!postId || !userId || !text) {
            return res.status(400).json({ message: 'postId, userId, and text are required' });
        }

        // Find the post by ID
        const findPost = await postModel.findById(postId);
        if (!findPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Find the user who is commenting
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create a new comment object
        const newComment = {
            userId,
            text,
            createdAt: new Date(),
            username: user.username,      // Include username
            profilePic: user.profilePic    // Include profile picture
        };

        // Push the new comment into the comments array
        findPost.comments.push(newComment);

        // Save the updated post
        await findPost.save();

        // Send response with the updated comments array
        res.status(200).json({
            message: 'Comment saved successfully',
            comments: findPost.comments  
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});




module.exports = router
