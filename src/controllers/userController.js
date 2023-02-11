const fs = require("fs");
// config
const {
    constructErrorMessage,
    handleUserAlreadyExists,
    throwError,
    handleUserNotFound,
} = require("../config/error");
// env
const {
    env: { JWT_SECRET_KEY },
} = process;

// utils
const {
    createUser,
    findOneUser,
    updateOneUser,
    signUserPayload,
} = require("../utils/models/user");

exports.updateProfileController = async (req, res) => {
    const {
        file: { path: filepath },
        user: { phone },
    } = req;

    // update user's profile property with filename
    const {
        data: { profile },
    } = await findOneUser(phone);

    // delete previous profile
    fs.exists(profile, (exist)=> {
        if (exist && profile) fs.unlinkSync(profile)
    })

    await updateOneUser(phone, { profile: filepath });

    return res
        .status(201)
        .json({ success: true, message: "Successfully uploaded files" });
};

exports.signUpController = async (req, res, next) => {
    const { name, phone } = req.body;

    const userExists = await findOneUser(phone);

    // inform the user that user with provided `phone` exists
    if (userExists.success && userExists.data) {
        return next(constructErrorMessage(handleUserAlreadyExists(phone), 400));
    }

    // some unpredicted error occurred
    if (!userExists.success && userExists.error !== handleUserNotFound(phone)) {
        return next(constructErrorMessage(userExists.error, 404));
    }

    const { data, error, success } = await createUser({
        name,
        phone,
        online_status: true,
        show_online_status: true,
        last_seen_status: Date.now(),
        show_last_seen_status: true,
        signed_token: "-",
    });

    if (!success) {
        return next(constructErrorMessage(error, 500));
    }

    return res.status(201).json({ data, error: "", success });
};

exports.signInController = async (req, res, next) => {
    const { phone: _phone } = req.body;
    const phone = Number(_phone);
    const { data, error, success } = await findOneUser(phone);

    if (!phone) {
        next(
            constructErrorMessage(
                "`phone` field was not provided in body of [ POST ] request"
            )
        );
    }

    // if userExists.success == false; an error occurred
    if (!success) {
        return next(constructErrorMessage(error, 400));
    }

    const { _id, name } = data;
    const token = signUserPayload({ _id, name, phone }, JWT_SECRET_KEY);

    let updateUser = await updateOneUser(phone, { signed_token: token });

    if (!updateUser.success) {
        return next(constructErrorMessage(updateUser.error, 500));
    }

    return res.status(200).json({ data: { token }, success: true });
};
