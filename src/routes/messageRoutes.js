// controllers
const { messageIOController } = require("../controllers/messageController");
// middleware
const { socketVerifyToken } = require("../middlewares/authenticate");
const { updateUserSocket } = require("../middlewares/socket");

exports.initializeMessageIO = (io, baseSocketUrl, handleDisconnect) => {
    io.of(`${baseSocketUrl}/message`, (socket) => {
        socket.on("disconnect", (payload) =>
            handleDisconnect(payload, socket, io)
        );
        messageIOController(io, socket);
    })
        .use(socketVerifyToken)
        .use(updateUserSocket);
};
