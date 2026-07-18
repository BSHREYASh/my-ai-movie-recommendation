import os
import time
import pickle
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import urllib.request
# ---------------------------------
# Load Environment Variables
# ---------------------------------
load_dotenv()

TMDB_TOKEN = os.getenv("TMDB_TOKEN")

app = Flask(__name__)
CORS(app)

# ---------------------------------
# Reuse HTTP Session
# ---------------------------------
session = requests.Session()

# ---------------------------------
# Load AI Model
# ---------------------------------
movies = pickle.load(open("movies.pkl", "rb"))

SIMILARITY_FILE = "similarity.pkl"

if not os.path.exists(SIMILARITY_FILE):
    print("Downloading similarity.pkl...")

    url = "https://huggingface.co/Subham5126/movie-recommendation-model/resolve/main/similarity.pkl"

    urllib.request.urlretrieve(url, SIMILARITY_FILE)

    print("Download complete!")

similarity = pickle.load(open(SIMILARITY_FILE, "rb"))
# ---------------------------------
# Recommendation Function
# ---------------------------------
def recommend(movie):
    try:
        movie_index = movies[movies["title"] == movie].index[0]

        distances = similarity[movie_index]

        movies_list = sorted(
            list(enumerate(distances)),
            reverse=True,
            key=lambda x: x[1]
        )[1:6]

        return [movies.iloc[i[0]].title for i in movies_list]

    except Exception as e:
        print("Recommendation Error:", e)
        return []


# ---------------------------------
# 🔍 Search Movies (Autocomplete)
# ---------------------------------
@app.route("/search", methods=["GET"])
def search_movies():

    query = request.args.get("q", "").strip().lower()

    if not query:
        return jsonify([])

    results = (
        movies[movies["title"].str.lower().str.contains(query, na=False)]
        .head(8)["title"]
        .tolist()
    )

    return jsonify(results)


# ---------------------------------
# Fetch Trailer
# ---------------------------------
def fetch_trailer(tmdb_id):

    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos"

    headers = {
        "Authorization": f"Bearer {TMDB_TOKEN}",
        "accept": "application/json"
    }

    try:

        response = session.get(
            url,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        videos = response.json().get("results", [])

        for video in videos:
            if (
                video.get("site") == "YouTube"
                and video.get("type") == "Trailer"
            ):
                return f"https://www.youtube.com/watch?v={video['key']}"

        for video in videos:
            if video.get("site") == "YouTube":
                return f"https://www.youtube.com/watch?v={video['key']}"

    except Exception as e:
        print("Trailer Error:", e)

    return None


# ---------------------------------
# Fetch Movie Details
# ---------------------------------
def fetch_movie_details(movie_name):

    if not TMDB_TOKEN:
        print("TMDB Token missing!")
        return None

    url = "https://api.themoviedb.org/3/search/movie"

    headers = {
        "Authorization": f"Bearer {TMDB_TOKEN}",
        "accept": "application/json"
    }

    params = {
        "query": movie_name
    }

    for attempt in range(3):

        try:

            response = session.get(
                url,
                headers=headers,
                params=params,
                timeout=10
            )

            response.raise_for_status()

            data = response.json()

            if not data.get("results"):
                return None

            movie = data["results"][0]

            poster = None

            if movie.get("poster_path"):
                poster = (
                    f"https://image.tmdb.org/t/p/w500"
                    f"{movie['poster_path']}"
                )

            trailer = fetch_trailer(movie["id"])

            return {
                "tmdb_id": movie.get("id"),
                "title": movie.get("title"),
                "poster": poster,
                "rating": movie.get("vote_average"),
                "overview": movie.get("overview"),
                "release_date": movie.get("release_date"),
                "language": movie.get("original_language", "").upper(),
                "popularity": movie.get("popularity"),
                "vote_count": movie.get("vote_count"),
                "adult": movie.get("adult", False),
                "trailer": trailer
            }

        except requests.exceptions.RequestException as e:

            print(f"Retry {attempt + 1}/3 : {movie_name}")

            if attempt == 2:
                print("TMDB Error:", e)
                return None

            time.sleep(1)

# ---------------------------------
# Fetch Popular Movies
# ---------------------------------
def fetch_popular_movies():

    url = "https://api.themoviedb.org/3/movie/popular"

    headers = {
        "Authorization": f"Bearer {TMDB_TOKEN}",
        "accept": "application/json"
    }

    try:

        response = session.get(
            url,
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        print(response.status_code)
        print(response.json())
        data = response.json()

        popular_movies = []

        for movie in data.get("results", [])[:20]:

            poster = None

            if movie.get("poster_path"):
                poster = (
                    f"https://image.tmdb.org/t/p/w500"
                    f"{movie['poster_path']}"
                )

            trailer = fetch_trailer(movie["id"])

            popular_movies.append({
                "tmdb_id": movie.get("id"),
                "title": movie.get("title"),
                "poster": poster,
                "rating": movie.get("vote_average"),
                "overview": movie.get("overview"),
                "release_date": movie.get("release_date"),
                "language": movie.get("original_language", "").upper(),
                "popularity": movie.get("popularity"),
                "vote_count": movie.get("vote_count"),
                "adult": movie.get("adult", False),
                "trailer": trailer
            })

        return popular_movies

    except Exception as e:
        print("Popular Movies Error:", e)
        return []

# ---------------------------------
# Home Route
# ---------------------------------
@app.route("/")
def home():
    return jsonify({
        "message": "🎬 Movie Recommendation API Running"
    })

# ---------------------------------
# Popular Movies Route
# ---------------------------------
@app.route("/popular", methods=["GET"])
def popular_movies():

    movies = fetch_popular_movies()

    return jsonify({
        "success": True,
        "count": len(movies),
        "movies": movies
    })

# ---------------------------------
# Recommendation Route
# ---------------------------------
@app.route("/recommend", methods=["POST"])
def recommend_movies():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No request body received."
            }), 400

        movie_name = data.get("movie", "").strip()

        if not movie_name:
            return jsonify({
                "success": False,
                "error": "Movie name is required."
            }), 400

        recommended_titles = recommend(movie_name)

        if not recommended_titles:
            return jsonify({
                "success": False,
                "error": "Movie not found."
            }), 404

        recommendations = []

        for title in recommended_titles:

            print(f"Searching TMDB: {title}")

            details = fetch_movie_details(title)

            if details:
                recommendations.append(details)

        return jsonify({
            "success": True,
            "count": len(recommendations),
            "recommendations": recommendations
        })

    except Exception as e:

        print("Backend Error:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ---------------------------------
# Run Flask
# ---------------------------------
if __name__ == "__main__":

    print("=" * 50)
    print("🎬 Movie Recommendation API")
    print("=" * 50)
    print("TMDB Token Loaded:", bool(TMDB_TOKEN))
    print("=" * 50)

    app.run(debug=True)