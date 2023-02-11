// controllers
const { roomIOController } = require("../controllers/roomController");
// middleware
const { socketVerifyToken } = require("../middlewares/authenticate");
const { updateUserSocket } = require("../middlewares/socket");

exports.initializeRoomIO = (io, baseSocketUrl, handleDisconnect) => {
    io.of(`${baseSocketUrl}/room`, (socket) => {
        socket.on("disconnect", (payload) =>
            handleDisconnect(payload, socket, io)
        );
        roomIOController(io, socket);
    })
        .use(socketVerifyToken)
        .use(updateUserSocket);
};
