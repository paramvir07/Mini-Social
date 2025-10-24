const express=require('express');
const app=express();
const userModel=require('./models/user');
const postModel=require('./models/post');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const upload =require("./config/multerconfig");
const { log } = require('console');

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const isLoggedIn=(req, res, next)=>{
    if (!req.cookies.token) return res.redirect('/login' );
    const data = jwt.verify(req.cookies.token, "secretufg")
    req.user = data;
    next();
}


app.get('/feed', async (req, res) => {
  const post = await postModel.find({}).populate('userId').sort({ date: -1 });      
  res.render('feed', {
    post, currentUser: req.user || null
  });
});

app.get("/profile/settings", isLoggedIn, (req,res)=>{
    res.render('settings');
    
})
app.post("/upload", upload.single('image'),  isLoggedIn, async (req,res)=>{

    const user = await userModel.findOne({_id: req.user.userId});

    user.profile = req.file.filename;
    await user.save();
    res.redirect('/profile');
    
})

app.get('/',((req,res)=>{
    res.render('index');
}))

app.get('/register',((req,res)=>{
    res.render('register');
}))

app.post('/register', async (req,res)=>{
    const {username,name, age, email, password} = req.body;
    
    const user=await userModel.findOne({email});

    if(user) return res.status(400).send("user already registered");

    bcrypt.genSalt(10, (err, salt)=> {
    bcrypt.hash(password , salt, async (err, hash)=> {
        const created_user= await userModel.create({
        username,
        name,
        age,
        email,
        password: hash
    })
    
    const token=jwt.sign({email, userId: created_user._id},"secretufg");
    res.cookie("token", token);
    res.redirect(`/profile`);
    });

});

});

app.get('/login',((req,res)=>{
    res.render('login');
}))

app.post('/login',(async(req,res)=>{
    const user= await userModel.findOne({email:req.body.email});

    if (!user) return res.send("username or password is incorrect");

    bcrypt.compare(req.body.password, user.password, function(err, result) {
    if (result) {
        const token = jwt.sign({email: user.email, userId: user._id},"secretufg")
        res.cookie("token", token);
        return res.redirect(`/feed`);
    }
    else{
        return res.send("username or pass is incorrect");
    }
});

}))

app.get('/logout', (req,res)=>{
    res.clearCookie("token");
    res.redirect("/")
    
})

app.get('/profile', isLoggedIn, async(req,res)=>{
    const user= await userModel.findOne({email: req.user.email}).populate("postId");
    res.render("profile", {user});
})

app.post("/create-post", isLoggedIn, async (req,res)=>{
    const postData=req.body.postData;
    const user= await userModel.findOne({_id: req.user.userId})
    const created_post = await postModel.create({
        postData,
        userId: user._id
    })

    user.postId.push(created_post._id);
    await user.save();

    res.redirect('/profile');

})

app.get('/like/:postId', isLoggedIn,  async(req,res)=>{
    const post= await postModel.findOne({_id:req.params.postId});
    const user= await userModel.findOne({_id:req.user.userId});
    if (!post.like.includes(user._id)){
    post.like.push(user._id);
    user.like.push(req.params.postId);
    }
    else{
        post.like.splice(post.like.indexOf(user._id), 1);
        user.like.splice(user.like.indexOf(post._id), 1);
    }
    await post.save();
    await user.save();
    res.redirect("/profile");
})

app.get('/edit/:postId', isLoggedIn,  async(req,res)=>{
    const post=await postModel.findOne({_id: req.params.postId});
    if (post.userId.equals(req.user.userId)) {
        res.render("edit", {postData: post.postData, postId: post._id});
    }
    else{
        res.status(403).send("wrong user");
    }
    
})

app.post('/edit-post/:postId', async(req,res)=>{
    const post=await postModel.findOne({_id: req.params.postId});

    if (!post.postData===req.body.postData) {
        res.status(403).send("wrong user");
    }
    else{
        
        post.postData=req.body.postData;
        await post.save();
        res.redirect('/profile');
    }
})




app.listen(3000); 