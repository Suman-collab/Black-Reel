import json

movies_path = r"c:\Users\Samsung\OneDrive\Desktop\Project\Black Reel\src\data\movies.json"

with open(movies_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for movie in data:
    if movie.get('title') == 'My Secret Affair with the Pool Boy':
        movie['hero_image'] = '/images/fandom/hero_pool_boy_banner.png'
    elif 'hero_image' in movie:
        del movie['hero_image']

with open(movies_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("hero banner fixed")
