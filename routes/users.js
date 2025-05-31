const express = require("express");
const passport = require("passport");
const router = express.Router();
const { storeReturnTo } = require("../middleware");
const users = require("../controllers/users");

router.route("/register").get(users.renderRegister).post(users.registerUser);

router
  .route("/login")
  .get(users.renderLogin)
  .post(
    storeReturnTo,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.loginUser
  );

router.get("/logout", users.logoutUser);

module.exports = router;
