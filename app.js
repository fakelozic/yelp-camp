if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const campgroundsRoutes = require("./routes/campgrounds");
const reviewsRoutes = require("./routes/reviews");
const usersRoutes = require("./routes/users");

const MondoDBStore = require("connect-mongo")(session);

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/yelp-camp";

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
  console.log("Database connected");
}

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());
// app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(), // Start with Helmet's defaults
      "script-src": [
        "'self'",
        "https://cdn.jsdelivr.net", // For Bootstrap
        "https://cdn.maptiler.com", // For MapTiler SDK
        "https://api.maptiler.com",
        "'unsafe-inline'", // MapTiler SDK might also need to connect here for tiles/data
      ],
      // You might also need to add sources for styles, workers, etc., for MapTiler
      "style-src": [
        "'self'",
        "https://cdn.jsdelivr.net", // For Bootstrap CSS
        "https://cdn.maptiler.com",
        "https://api.maptiler.com",
        "https://res.cloudinary.com/duyolsy3m/", // For MapTiler CSS if any
        "'unsafe-inline'", // If MapTiler or Bootstrap use inline styles
      ],
      "worker-src": [
        "'self'",
        "blob:", // MapTiler SDK often uses web workers loaded via blob URLs
      ],
      "connect-src": [
        "'self'",
        "https://api.maptiler.com", // For MapTiler API calls to fetch map tiles, etc.
      ],
      // Add other directives as needed (img-src for map tiles, etc.)
      "img-src": [
        "'self'",
        "data:",
        "https://api.maptiler.com",
        "https://res.cloudinary.com/duyolsy3m/",
        "https://images.unsplash.com",
      ], // For map tiles
    },
  })
);

const store = new MondoDBStore({
  url: dbUrl,
  secret: "this-should-be-better-secret!",
  touchAfter: 24 * 3600,
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store,
  name: "blah",
  secret: "this-should-be-better-secret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/fake-user", async (req, res) => {
  const user = new User({ email: "fake@gmail.com", username: "fakelozic" });
  const newUser = await User.register(user, "password");
  res.send(newUser);
});

app.use("/campgrounds", campgroundsRoutes);
app.use("/campgrounds/:id/reviews", reviewsRoutes);
app.use("/", usersRoutes);

app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).render("error.ejs", { err });
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening port ${process.env.PORT}`);
});
