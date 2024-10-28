const express = require('express')
const router = express.Router()

const multer = require('multer');
const cloudinary = require('./config/cloudinary.config');
const userModel = require('./models/user.model');
const postModel = require('./models/post.model')

const storage = multer.memoryStorage();
const upload = multer({ storage });


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/upload/:userId', upload.single('file'), async(req, res) => {
    // console.log('Received file:', req.file); // Log the received file
    const {userId} = req.params
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'image', public_id:userId }, async(error, result) => {
        if (error) {
            console.error('Cloudinary error:', error);
            return res.status(500).send('Cloudinary upload error: ' + error.message);
        }

        await userModel.findByIdAndUpdate(userId, {profilePic:result.secure_url},{new:true});
        console.log('Cloudinary result:', result); // Log the Cloudinary result
        res.status(200).json({
            message: 'Image uploaded successfully',
            imageUrl: result.secure_url,
        });
    });

    // Ensure the file buffer is passed to Cloudinary
    uploadStream.end(req.file.buffer);
});

// router.post('/post/:postId', async(req, res) => {
//     const {postId} = req.params;
//     if (!req.file) {
//         return res.status(400).send('No file uploaded.');
//     }

//     const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'image', public_id:postId }, async(error, result) => {
//         if (error) {
//             console.error('Cloudinary error:', error);
//             return res.status(500).send('Cloudinary upload error: ' + error.message);
//         }

//         await postModel.findByIdAndUpdate(postId, {image:result.secure_url},{new:true});
//         console.log('Cloudinary result:', result); // Log the Cloudinary result
//         res.status(200).json({
//             message: 'Image uploaded successfully',
//             imageUrl: result.secure_url,
//         });
//     });
//     uploadStream.end(req.file.buffer);
// })
module.exports = router;
