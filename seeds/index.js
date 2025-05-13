const mongoose = require("mongoose");
const cities = require("./cities");
const Campground = require("../models/campground");
const { descriptors, places } = require("./seedHelpers");

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");
  console.log("Database connected");
}

const sample = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 50; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const camp = new Campground({
      title: `${sample(descriptors)} ${sample(places)}`,
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      price: Math.floor(Math.random() * 30) + 20,
      image: `https://picsum.photos/400?random=${Math.random()}`,
      description:
        "What is Camping? Camping is an outdoor activity that involves staying the night/more than one night in a protective shelter out in nature. Camping is a broad term but in its essence, camping is a way of getting away from the hassle of urban life, to a more natural environment for a limited time.",
    });
    await camp.save();
  }
};
seedDB().then(() => {
  mongoose.connection.close();
});
