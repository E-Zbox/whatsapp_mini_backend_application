exports.handleEndpointNotFound = (method, endpoint) =>
    `[ ${method} ] '${endpoint}' does not exist`;

exports.handleUserAlreadyExists = (phone) =>
    `User with phone: \`${phone}\` already exists`;

exports.handleUserNotFound = (payload) =>
    `User with payload: \`${JSON.stringify(payload)}\` not found`;

exports.handleRoomNotFound = (payload) =>
    `Room with ${JSON.stringify(payload)} not found`;

exports.throwError = (error) => {
    throw new Error(error);
};

exports.constructErrorMessage = (message, status = 500) => ({
    message,
    status,
});

exports.SERVER_ERR = "Something went wrong";
