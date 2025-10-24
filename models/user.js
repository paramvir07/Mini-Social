const mongoose = require ('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/miniproject");

const userSchema=({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    postId:[ { type: mongoose.Schema.Types.ObjectId, ref: "post" } ],
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
    profile: {
        type: String,
        default: "default.png"
    }
})

const userModel=mongoose.model("user", userSchema);
module.exports=userModel;