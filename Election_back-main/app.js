const express= require('express')
const mongoose = require('mongoose')
const cors  = require('cors')
const dotenv = require('dotenv')
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

const connect=()=>{
    return mongoose.connect(process.env.MONGOURL)
}
const userRoutes = require('./models/userModel/userRoutes')
const electionRoutes = require('./models/electionModel/electionRoutes')
app.use('/v1',userRoutes)
app.use('/v1',electionRoutes)

app.listen(process.env.PORT || 5678,()=>{
    connect()
    console.log('database connected')
})



