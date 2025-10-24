const mongoose =require('mongoose');

const postSchema = mongoose.Schema({
    
    postData: String,
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "user" },
    date: { type: Date, default: Date.now() },
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }]

})

const postModel= mongoose.model("post", postSchema);
module.exports=postModel;