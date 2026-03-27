import json
import os

custom_titles = [
    "My Secret Affair with the Pool Boy",
    "My Millionaire Baby Daddy",
    "My Girlfriend Is a Secret Escort",
    "The Velvet Room: Burlesque Show Las Vegas",
    "The Heiress Waitress",
    "I Got Pregnant by Personal Trainer",
    "Love Match"
]

valid_images = [f"/images/fandom/Poster {i} - 150x200.jpg.jpeg" for i in range(1, 8)]

public_dir = r"c:\Users\Samsung\OneDrive\Desktop\Project\Black Reel\public"
movies_path = r"c:\Users\Samsung\OneDrive\Desktop\Project\Black Reel\src\data\movies.json"

with open(movies_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

img_index = 0
custom_index = 0

for movie in data:
    # Check if image exists
    img_path = public_dir + movie['image'].replace('/', '\\')
    if not os.path.exists(img_path):
        movie['image'] = valid_images[img_index % len(valid_images)]
        img_index += 1
    
    # Rename Fandom Uploads specifically 18-24
    if movie.get('id') >= 18 and movie.get('id') <= 24:
        movie['title'] = custom_titles[custom_index]
        movie['image'] = valid_images[custom_index]
        custom_index += 1

with open(movies_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("movies.json updated successfully.")
