const Router = require("express").Router();
// controllers
const {
    updateProfileController,
    signUpController,
    signInController,
} = require("../controllers/userController");
// middlewares
const { verifyToken } = require("../middlewares/authenticate");
const parseFileUpload = require("../middlewares/fileUpload");

Router.post("/sign-up", signUpController).post("/sign-in", signInController);

Router.post(
    "/profile/upload",
    verifyToken,
    parseFileUpload,
    updateProfileController
);
module.exports = Router;
