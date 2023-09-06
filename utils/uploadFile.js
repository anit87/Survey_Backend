const multer = require("multer")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public')
    },
    filename: function (req, file, cb) {
        cb(null, "Voter_Id_Image/" + Date.now() + ' - ' + file.originalname)
    }
})

const upload = multer({ storage: storage })

module.exports = upload;