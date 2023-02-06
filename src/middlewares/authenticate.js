// env
const {
    env: { JWT_SECRET_KEY },
} = process;
// errors
const { constructErrorMessage } = require("../config/error");
// utils
const { findOneUser, verifyUserToken } = require("../utils/models/user");

const verifyTokenHelperFunc = async (_req_socket, next, token) => {
    // verify token
    const { data, error, success } = verifyUserToken(token, JWT_SECRET_KEY);

    if (!success) {
        console.log(error);
        const { name, message } = JSON.parse(error);
        if (name === "TokenExpiredError") {
            return next(
                constructErrorMessage(
                    "Provided token is expired. Head over to /api/v1/auth/user/sign-in to login",
                    403
                )
            );
        } else if (name === "JsonWebTokenError") {
            return next(
                constructErrorMessage(
                    "Provided token was malformed. Confirm token and try again",
                    401
                )
            );
        } else {
            return next(constructErrorMessage(message, 400));
        }
    }

    const findUserResponse = await findOneUser(data.phone);

    if (!findUserResponse.success) {
        return next(constructErrorMessage(findUserResponse.error, 400));
    }

    if (findUserResponse.data.signed_token !== token) {
        return next(
            constructErrorMessage(
                "Token does not match with `signed` token. Head over to /api/v1/auth/user/sign-in to login",
                403
            )
        );
    }

    _req_socket.user = data;
    next();
};

/**
 *
 * @param {*} req httpIncomingMessage
 * @param {*} res Response
 * @param {*} next Call next middleware/controller
 */
exports.verifyToken = (req, res, next) => {
    const { authorization } = req.headers;
    const [_, token] = authorization.split(" ");
    verifyTokenHelperFunc(req, next, token);
};

exports.socketVerifyToken = (socket, next) => {
    const { authorization } = socket.handshake.headers;

    if (!authorization) {
        return next(
            constructErrorMessage(
                "No authorization token was provided. Set Authorization ` Bearer {{token}}` in Header.",
                400
            )
        );
    }
    const [_, token] = authorization.split(" ");

    verifyTokenHelperFunc(socket, next, token);
};
