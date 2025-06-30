const { User } = require('./userSchema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

module.exports.Register = async (req, res) => {
 
    try {
        const isVoterId = await User.findOne({ "voterId": req.body.voterId })
        if (isVoterId) {
            return res.json({ success: false, message: "user already registered, please login" })
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = await User.create({ ...req.body, password: hashedPassword })
        if (!user) {
            return res.json({ success: false, message: "internal error" })
        }
        return res.json({ success: true, message: "Registration successful" })

    }
    catch (err) {
        console.log(err)
        return res.json({ success: false, message: err })

    }
}


module.exports.Login = async (req, res) => {
    try {
        const isVoterId = await User.findOne({ voterId: req.body.voterId })
        if (!isVoterId) {
            return res.json({ success: false, message: "user not Registred, please register first" })
        }
        const comparePassword = await bcrypt.compare(req.body.password, isVoterId.password)
        if (!comparePassword) {
            return res.json({ success: false, message: "Incorrect password" })
        }
        const token = jwt.sign(isVoterId.voterId, "SECRET_KEY")
        return res.json({ success: true, message: "Login succesfull", token,details:isVoterId })

    }
    catch (err) {
        console.log(err)
        return res.json({ success: false, message: err })

    }
}


module.exports.GetAllUsers=async(req,res)=>{
    try{
        const allUsers = await User.find()
        if(allUsers){
            return res.json({success:true,message:"Users fetched successfully",allUsers})
        }
        return res.json({success:false,message:"fetching users failed"})
    }catch(err){
        console.log(err);
        return res.json({success:false,message:"Internal server error"})
    }
}
module.exports.DeleteUser=async(req,res)=>{
    try{

        const deleteUser = await User.findByIdAndDelete(req.params.id)
        if(deleteUser){
            return res.json({success:true,message:"User deleted successfully"})
        }
        return res.json({success:false,message:"deleting user failed"})
    }catch(err){
        console.log(err);
        return res.json({success:false,message:"Internal server error"})
    }
}
module.exports.UpdateUser=async(req,res)=>{
    console.log(req.params.id)
    console.log(req.body)
    try{

        const updateUser = await User.findByIdAndUpdate(req.params.id,req.body,{
            new:true
        })
        if(updateUser){
            return res.json({success:true,message:"User updated successfully",user:updateUser})
        }
        return res.json({success:false,message:"updating user failed"})
    }catch(err){
        console.log(err);
        return res.json({success:false,message:"Internal server error"})
    }
}

module.exports.GetUser = async(req,res)=>{
    try{
        const user = await User.findOne({voterId:req.body.userId})
        console.log(user)
        if (!user){
            return res.json({success:false,message:"invalid user"})
        }
        return res.json({success:true,message:"fetched user successfully",user:user})

    }catch(err){
        console.log(err)
        return res.json({success:false,message:"invalid user"})

    }
}

