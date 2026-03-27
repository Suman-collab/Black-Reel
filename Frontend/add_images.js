const fs = require('fs');

async function updateFandomImages() {
  try {
    const dataTxt = fs.readFileSync('./src/data/movies.json', 'utf8');
    let data = JSON.parse(dataTxt);

    const newImages = [
      "WhatsApp Image 2026-03-03 at 3.00.47 PM.jpeg",
      "WhatsApp Image 2026-03-03 at 3.00.48 PM.jpeg",
      "WhatsApp Image 2026-03-03 at 3.03.28 PM.jpeg",
      "WhatsApp Image 2026-03-03 at 3.03.29 PM.jpeg",
      "series.jpeg",
      "series1.jpeg",
      "thumbnail.jpeg"
    ];

    const existingImages = new Set(data.filter(m => m.image).map(m => {
      return decodeURIComponent(m.image).split('/').pop();
    }));

    let maxId = data.length > 0 ? Math.max(...data.map(m => m.id)) : 0;
    let added = 0;

    for (const img of newImages) {
      if (!existingImages.has(img)) {
        data.push({
          id: ++maxId,
          title: "Fandom Entry " + (added + 1),
          type: "Movie",
          genre: "Drama",
          desc: "Newly added image for Fandom.",
          image: "/images/fandom/" + encodeURIComponent(img),
          tags: ["fandom"]
        });
        added++;
        existingImages.add(img);
      }
    }

    fs.writeFileSync('./src/data/movies.json', JSON.stringify(data, null, 2), 'utf8');
    console.log("Successfully added " + added + " new items.");

  } catch (err) {
    console.error("Error updating json:", err.message);
  }
}

updateFandomImages();
