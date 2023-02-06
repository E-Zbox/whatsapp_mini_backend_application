// controllers
const { messageIOController } = require("../controllers/messageController");
// middleware
const { socketVerifyToken } = require("../middlewares/authenticate");
const { updateUserSocket } = require("../middlewares/socket");

exports.initializeMessageIO = (io, baseSocketUrl) => {
    io.of(`${baseSocketUrl}/message`, (socket) =>
        messageIOController(io, socket)
    )
        .use(socketVerifyToken)
        .use(updateUserSocket);
};
