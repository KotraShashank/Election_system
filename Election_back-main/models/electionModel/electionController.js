const {Election} = require('./electionSchema')
const {User} = require('../userModel/userSchema')
const { request } = require('express')
module.exports.CreateElection = async(req,res)=>{
    try{
        const createElection = await Election.create(req.body)
        if(!createElection){
            return res.json({message:"Creating election Failed",success:false})
        }
        return res.json({message:"Creating election successfull",success:true})

    }
    catch(err){
        console.log(err)
        return res.json({message:"Internal error",success:false})
    }

}
module.exports.GetAllElections = async(req,res)=>{
    try{
        const getAllElections = await Election.find()
        if(!getAllElections){
            return res.json({message:"Fetching elections Failed",success:false})
        }
        return res.json({message:"Fetching election successfull",success:true,elections:getAllElections})

    }
    catch(err){
        console.log(err)
        return res.json({message:"Internal error",success:false})
    }

}


module.exports.GetSpecifiedElection=async(req,res)=>{
    try{
        const user = await User.findOne({voterId:req.body.userId})
        if(!user){
            return res.json({message:"Internal error",success:false})
        }
        const elections = await Election.find({constituency:user.constituency})
        return res.json({success:true,message:"fetched elections successfully",elections:elections})
        

    }  
    catch(err){
        console.log(err)
        return res.json({message:"Internal error",success:false})
    }
}

module.exports.GetElectionById=async(req,res)=>{
    try{
        const election = await Election.findById(req.params.id)
        if(!election){
            return res.json({message:"Internal error",success:false})
        }
        return res.json({success:true,message:"fetched election successfully",candidates:election})

    }catch(err){
        console.log(err)
        return res.json({message:"Internal error",success:false})
    }
}

module.exports.SubmitVote = async (req, res) => {
    const { electionId, candidateId } = req.body;
  
    try {
      const election = await Election.findById(electionId);
  
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }
  
      const user = await User.findOne({ voterId: req.body.userId });
  

      const isUserInVoters = election.voters.some((voter) => voter.voterId.equals(user._id));
  
      if (!isUserInVoters) {
  
        election.voters.push({ voterId: user._id });
      } else {
        return res.status(403).json({ message: 'You have already voted in this election' });
      }
  
      const currentDate = new Date();
      if (
        currentDate < new Date(election.electionStartDate) ||
        currentDate > new Date(election.electionEndDate)
      ) {
        return res.status(400).json({ message: 'Election is not currently open for voting' });
      }
  
      const candidate = election.candidates.find((c) => c._id.equals(candidateId));
  
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found in the election' });
      }

      candidate.votes += 1;

      await election.save();
  
      res.status(200).json({ message: 'Vote submitted successfully' });
    } catch (error) {
      console.error('Error submitting vote:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  
