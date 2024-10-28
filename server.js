const express = require('express')
const app = express();
const mongoose = require('mongoose')

const cors = require('cors');

require('dotenv').config();
require('colors')
app.use(cors());
app.use(express.json())

const multerFile = require('./multer');
app.use('/',multerFile)
app.get("/",(req,res) => {
    res.send("Hello, Instaloop!")
})
const userRoute = require('./routes/user.route')
app.use('/api/user',userRoute)

const postRoute = require('./routes/post.route')
app.use('/api/post',postRoute)


mongoose.connect(process.env.DB).then(() => console.log('Database connection established'.bgGreen))
app.listen(process.env.PORT,() => console.log(`Server listening on port:${process.env.PORT}`.bgCyan))

