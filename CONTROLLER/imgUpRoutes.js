const express = require('express')
const router = express.Router()
require('dotenv').config()
const cloudinary = require('cloudinary').v2
const multer = require('multer')
const User  = require('../MODELS/UserSchema')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret:process.env.API_SECRET
})


const storage = multer.memoryStorage()
const upload = multer({ storage : storage})
router.post('/uploadpropic',upload.single('myimage'),async (req,res,)=> {
    const file = req.file
   
})




module.exports = router