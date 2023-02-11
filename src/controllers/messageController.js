// event emitters and listeners
const {
    events: { CREATE_MESSAGE, GET_MESSAGES },
    functions: { createMessage, getMessages },
} = require("./events/listeners");
// socket middlewares
const { addSocketToRoom } = require("../middlewares/message");

exports.messageIOController = (io, socket) => {
    socket.use((packet, next) => addSocketToRoom(packet, next, socket));
    socket.on(CREATE_MESSAGE, (payload) => createMessage(payload, socket, io));
    socket.on(GET_MESSAGES, (payload) => getMessages(payload, socket));
};
