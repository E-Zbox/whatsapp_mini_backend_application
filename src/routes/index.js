const { initializeMessageIO } = require("./messageRoutes");
const { initializeRoomIO } = require("./roomRoutes");

module.exports = {
    socketRoutes: { initializeMessageIO, initializeRoomIO },
    userRoutes: require("./userRoutes"),
};
