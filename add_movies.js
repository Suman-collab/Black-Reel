const fs = require("fs");
const data = JSON.parse(fs.readFileSync("./src/data/movies.json", "utf8"));
const newImages = [
  "WhatsApp Image 2026-03-03 at 3.00.47 PM.jpeg",
  "WhatsApp Image 2026-03-03 at 3.00.48 PM.jpeg",
  "WhatsApp Image 2026-03-03 at 3.03.28 PM.jpeg",
  "WhatsApp Image 2026-03-03 at 3.03.29 PM.jpeg",
  "series.jpeg",
  "series1.jpeg",
  "thumbnail.jpeg"
];

const existingIds = data.map(m => m.id);
let startId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
const existingImages = new Set(data.filter(m => m.image).map(m => decodeURIComponent(m.image).split("/").pop()));

let added = 0;

newImages.forEach(img => {
  if (!existingImages.has(img)) {
    data.push({
      id: startId++,
      title: "New Fandom " + (added + 1),
      type: "Movie",
      genre: "Drama",
      desc: "Newly added image.",
      image: `/images/fandom/${img}`,
      tags: ["fandom"]
    });
    added++;
  }
});

fs.writeFileSync("./src/data/movies.json", JSON.stringify(data, null, 2));
console.log("Added " + added + " items.");
