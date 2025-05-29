const express = require("express");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");
const router = express.Router();
const { storeReturnTo } = require("../middleware");

function capitalizeWords(string) {
  if (!string) return "";
  return string
    .split(" ") // Split the string into an array of words. [1, 16]
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word, and optionally lowercase the rest. [1, 15]
    .join(" "); // Join the words back into a string with spaces. [1, 16]
}

router.get("/register", (req, res) => {
  res.render("users/register.ejs");
});

router.post(
  "/register",
  catchAsync(async (req, res, next) => {
    try {
      const { email, username, password } = req.body;
      let {name} = req.body;
      name = capitalizeWords(name);
      const user = new User({ email, username, name });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, (err) => {
        if (err) next(err);
        req.flash("success", "Welcome to Yelp Camp!");
        res.redirect("/campgrounds");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/register");
    }
  })
);

router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});
router.post(
  "/login",
  storeReturnTo,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "Welcome Back!");
    const redirectUrl = res.locals.returnTo || "/campgrounds";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Goodbye!");
    res.redirect("/campgrounds");
  });
});
module.exports = router;
