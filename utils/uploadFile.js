const multer = require("multer")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public')
    },
    filename: function (req, file, cb) {
        cb(null, "Voter_Id_Image/" + Date.now() + ' - ' + file.originalname)
    }
})

const upload = multer({ storage: storage,limits: { fieldSize: 25 * 1024 * 1024 } })


const cpUpload = upload.fields([
    { name: 'voterIdImage', maxCount: 10 },
    { name: 'locationPicture', maxCount: 10 },
    { name: 'voterIdImageMember[0]', maxCount: 10 },
    { name: 'voterIdImageMember[1]', maxCount: 10 },
    { name: 'voterIdImageMember[2]', maxCount: 10 },
    { name: 'voterIdImageMember[3]', maxCount: 10 },
    { name: 'voterIdImageMember[4]', maxCount: 10 },
    { name: 'voterIdImageMember[5]', maxCount: 10 },
    { name: 'voterIdImageMember[6]', maxCount: 10 },
    { name: 'voterIdImageMember[7]', maxCount: 10 },
    { name: 'voterIdImageMember[8]', maxCount: 10 },
    { name: 'voterIdImageMember[9]', maxCount: 10 }
])

module.exports = cpUpload;