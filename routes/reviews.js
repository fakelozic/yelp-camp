const express = require("express");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware");
const reviews = require("../controllers/reviews");

const router = express.Router({ mergeParams: true });

router.post("/", isLoggedIn, validateReview, reviews.createReview);
router.delete("/:reviewID", isLoggedIn, isReviewAuthor, reviews.deleteReview);

module.exports = router;
