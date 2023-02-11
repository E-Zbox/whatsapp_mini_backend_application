const fs = require("fs");
const multer = require("multer");
const { join } = require("path");
// error
const { throwError } = require("../config/error");

const supported_types = [
    "image/png",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/bmp",
    "image/webp",
];

const fileSize = 1024 * 1024; // 1mb

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // console.log("I got here");
        var dest = join(__dirname, "../uploads/images");

        if (!fs.existsSync(dest)) {
            throwError(
                "File upload destination does not exist. Contact the API werey😂😂 developer ASAP"
            );
        }

        // console.log("destination >> ", file);

        cb(null, dest);
    },
    filename: (req, file, cb) => {
        // console.log("filename [line 34] >> ", file);
        let filename = `(${Date.now()}) ${file.originalname}`;
        // console.log({filename})
        cb(null, filename);
    },
});

const upload = multer({
    fileFilter: (req, file, cb) => {
        // accept only image files i.e mimetype => 'image/png'
        // console.log("fileFilter >> ", file);
        const { mimetype } = file;
        if (!supported_types.includes(mimetype))
            throwError(
                `${mimetype} mimetype is not supported. ${supported_types} are supported`
            );

        cb(null, true);
    },
    limits: {
        fileSize,
    },
    storage,
});

module.exports = upload.single("file");
