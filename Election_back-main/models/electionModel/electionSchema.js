const mongoose = require('mongoose')

const electionSchema = new mongoose.Schema({
    constituency:{
        type:String,
        required:true
    },

    electionStartDate:{
        type:Date,
        required:true
    },
    electionStartTime:{
        type:String,
        required:true
    },
    electionEndDate:{
        type:Date,
        required:true
    },
    electionEndTime:{
        type:String,
        required:true
    },
    candidates:[
        {
        candidateName:{
            type:String,
            required:true

        },
        party:{
            type:String,
            required:true
        },
        votes:{
            type:Number,
            default:0
        }
    }
    ],
    voters:[
        {
            voterId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true
            }
        }
    ]
},{
    timestamps:true
})

module.exports.Election = new mongoose.model("Election",electionSchema)

