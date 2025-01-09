const cookieParser = require('cookie-parser');
const express=require('express');
const userModel = require('./models/user.models');
const postModel = require('./models/post.models');
const app=express();

const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/', isLoggedIn, (req,res)=>{
    res.render("index");
})
app.get('/login', (req,res)=>{
    res.render("login");
})

app.get('/profile', isLoggedIn, (req,res)=>{
    console.log(req.user);
    res.render("login");
})

app.post('/register',  async (req,res)=>{
    let {email, password, username, name, age}= req.body;

    let user= await userModel.findOne({email});
    if(user) return res.status(409).send("User already registered");

    bcrypt.genSalt(10, (err, salt)=>{
        console.log(salt);
        bcrypt.hash(password, salt, async (err, hash)=>{
            let user=await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            })
            let token=jwt.sign({email: email, userid: user._id}, "secret");
            res.cookie("token", token);
            res.send("registered");
        })
    })
})

app.post('/login',  async (req,res)=>{
    let {email, password}= req.body;

    let user= await userModel.findOne({email});
    if(!user) return res.status(409).send("Something went wrong...");

    bcrypt.compare(password, user.password, (err, result)=> {
        if(result){
            let token=jwt.sign({email: email, userid: user._id}, "secret");
            res.cookie("token", token);
            res.status(200).send("You can Login");
        }    
        else{
            res.redirect('/login');
        }
    });
})

app.get('/logout', (req,res)=>{
    res.cookie("token", "");
    res.redirect('/login');
})

app.listen(3000);

function isLoggedIn(req, res, next){
    if (!req.cookies.token) {
        res.send("You must be logged In");
    } else {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    }
}
