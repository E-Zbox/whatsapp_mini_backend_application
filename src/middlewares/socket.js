// errors
const { constructErrorMessage } = require("../config/error");
// utils
const { findOneUser, updateOneUser } = require("../utils/models/user");

exports.updateUserSocket = async (_socket, next) => {
    const socket = { id: _socket.id };

    // check if the User: socket.id property is in-sync with the id provide by socket.io
    const { data: userData } = await findOneUser(_socket.user.phone);

    if (userData.socket?.id !== socket.id) {
        // update socket value
        console.log("this", {
            "userData.socket.id": userData.socket.id,
            socket,
        });
        const { data, error, success } = await updateOneUser(
            _socket.user.phone,
            {
                socket,
            }
        );

        if (!success) {
            return next(constructErrorMessage(error, 404));
        }
    }

    next();
};
