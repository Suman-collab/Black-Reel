import json
import os

valid_images = [
    "/images/fandom/Poster 1 - 150x200.jpg.jpeg",
    "/images/fandom/Poster 2 - 150x200.jpg.jpeg",
    "/images/fandom/Poster 3 - 150x200.jpg.jpeg",
    "/images/fandom/Poster 4 - 150x200.jpg.jpeg",
    "/images/fandom/Poster 5 - 150x200.jpg.jpeg",
    "/images/fandom/Poster 6 - 150x200.jpg.jpeg",
    "/images/fandom/Poster 7 - 150x200.jpg.jpeg"
]

movies_path = 'src/data/movies.json'
with open(movies_path, 'r') as f:
    data = json.load(f)

for i, movie in enumerate(data):
    movie['image'] = valid_images[i % len(valid_images)]

with open(movies_path, 'w') as f:
    json.dump(data, f, indent=2)

print("movies.json updated successfully.")
