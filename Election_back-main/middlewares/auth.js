const jwt = require('jsonwebtoken')
module.exports.verifyUser = (req, res, next) => {
    console.log(req.headers)
    try {
        const token = req.headers.authorization;
        const tokenDecrypted = jwt.verify(token, "SECRET_KEY")
        console.log(tokenDecrypted)
        req.body.userId = tokenDecrypted
        next()
    } catch (err) {
        res.send({ success: false, message: err.message })
    }
}