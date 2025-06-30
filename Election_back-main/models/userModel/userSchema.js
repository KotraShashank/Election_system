const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    voterId:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    phoneNumber:{
        type:Number,
        required:true,
        min:10,    
    },
    password:{
        type:String,
        required:true
    },
    constituency:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:"voter"
    }
},
{
    timestamps:true
})

module.exports.User = new mongoose.model("User",userSchema)