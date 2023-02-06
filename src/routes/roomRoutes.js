// controllers
const { roomIOController } = require("../controllers/roomController");
// middleware
const { socketVerifyToken } = require("../middlewares/authenticate");
const { updateUserSocket } = require("../middlewares/socket");

exports.initializeRoomIO = (io, baseSocketUrl) => {
    io.of(`${baseSocketUrl}/room`, (socket) => roomIOController(io, socket))
        .use(socketVerifyToken)
        .use(updateUserSocket);
};
