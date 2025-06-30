const router = require('express').Router()
const controller= require('./electionController')
const {verifyUser}= require('../../middlewares/auth')

router.post('/create_election',verifyUser,controller.CreateElection);
router.get('/get_all_elections',verifyUser,controller.GetAllElections);
router.get('/get_specified_election',verifyUser,controller.GetSpecifiedElection);
router.get('/get_candidates_by_election/:id',verifyUser,controller.GetElectionById);
router.post('/submit_vote',verifyUser,controller.SubmitVote);

module.exports  = router