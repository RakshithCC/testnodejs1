const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const PORT = 8000
require('dotenv').config()
require('./db')
const app = express()
const User = require('./MODELS/UserSchema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const imageUproutes=require('./CONTROLLER/imgUpRoutes')
app.use(bodyParser.json())
app.use(cors())
app.use(cookieParser())
app.use('/imageupload',imageUproutes)

function authenticateToken(req,res,next){
    const token = req.headers.authorization.split(' ')[1]
    const {id} = req.body
    // console.log('token',token);
    if(!token){
        const error = new Error('Token Not found')
        next(error)
    }
    // } return res.status(401).json({message: 'Authen Error'})
 
    try{
    const decoded = jwt.verify(token , process.env.JWT_SECRET_KEY)
        if(id && decoded.id !== id){
            // return res.status(401).json({ message : 'Auth Error'})
            const error = new Error('Invalid Token')
            next(error)
        }
        req.id = decoded
    next()
    }catch(err){
        // res.status(500).json({ message: ' invalid Token'})
        next(err)
    }



    
}


app.get('/',(req,res) => {
    res.json({ message: 'The API is working!'});
})

app.post('/register',async(req,res)=>{
    try{
        const { name , password , email , age , gender } = req.body
        const existingUser = await User.findOne({email})

        if(existingUser){
            return res.status(409).json({message : 'Username already exists'})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)
        const newUser = new User({
            name,
            password: hashedPassword,
            email,
            age,
            gender
        })
        await newUser.save()
        res.status(201).json({
            message : 'User registerd Succesfully'
        })
    }
    catch(err){
        res.status(500).json({message : err.message})
    }
})

app.post('/login',async(req,res,next)=>{
    try{
         const {email, password} = req.body

         const existingUser = await User.findOne({email})
         if(!existingUser){
            // return res.status(401).json({message: 'Invalid credentials'})
            const error = new Error('User does not exist')
            next(error)
         }
         
         const isPasswordCorrect = await bcrypt.compare(password,existingUser.password)
          if(!isPasswordCorrect){
            // return res.status(401).json({message: 'Invalid credentials'})
            const error = new Error('Invalid credentials')
            next(error)
          }

          const accsesstoken = jwt.sign({id : existingUser._id},process.env.JWT_SECRET_KEY,{
            expiresIn :60
          })

          const refreshToken = jwt.sign({id : existingUser._id},process.env.JWT_REFRESH_SECRET_KEY)
           existingUser.refreshToken=refreshToken
           await existingUser.save()

           res.cookie('refreshToken',refreshToken,{httpOnly: true , path: '/refresh_token'})
          res.status(200).json(
            {
                accsesstoken,
                refreshToken,
                message : 'User loggedIn Successfully'
            }
          )

    }
    catch(err){
            // res.status(500).json({message: err.message})
            next(err)
    }
})

app.get('/getmyprofile',authenticateToken,async(req,res)=>{
    const {id} = req.body
    const user = await User.findById(id)
    res.status(200).json({ user})
})

app.get('/refresh_token',async(req,res,next)=>{
    const token = req.cookies.refreshToken
    // res.send(token)
    if(!token){
        const error = new Error('Token not found')
        next(error)
    }
    jwt.verify(token,process.env.JWT_REFRESH_SECRET_KEY,async(err,decoded)=>{
        if(err){
            const error = new Error('Token not found')
            next(error)
        }
        const id=decoded.id
        const existingUser = await User.findById(id)
        if(!existingUser || token !==existingUser.refreshToken)//comparing cookie token and database refresh token 
        {
            const error = new Error('Invalid Token')
            next(error)
        }

        const accsesstoken = jwt.sign({id : existingUser._id},process.env.JWT_SECRET_KEY,{
            expiresIn :60
          })
          const refreshToken = jwt.sign({id : existingUser._id},process.env.JWT_REFRESH_SECRET_KEY)
          existingUser.refreshToken=refreshToken
          await existingUser.save()
          res.status(500).json({
            accsesstoken,
            refreshToken,
            message: 'Token refresh succesfully'
          })
    })
})
// ERROR HANDLING MIDDLEWARE
app.use((err,req,res,next)=>{
    console.log('error:',err);
    res.status(500).json({message: err.message})
})


app.listen(PORT,() =>{
    console.log(`server running on port ${PORT}`);
})