import { useState, useEffect } from "react";
import "./App.css";

import Hero from "./components/Hero";
import SearchBar from "./components/SearchBar";
import Loader from "./components/Loader";
import MovieCard from "./components/MovieCard";
import MovieModal from "./components/MovieModal";

function App() {
  const [movie, setMovie] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(false);

  // ❤️ Favorites
  const [favorites, setFavorites] = useState([]);

  // 🔥 Sorting
  const [sortBy, setSortBy] = useState("popularity");

  // ----------------------------
  // Load Favorites
  // ----------------------------

  useEffect(() => {
    const savedFavorites =
      JSON.parse(localStorage.getItem("favorites")) || [];

    setFavorites(savedFavorites);
  }, []);

  // ----------------------------
  // Load Popular Movies
  // ----------------------------

  useEffect(() => {
    fetchPopularMovies();
  }, []);

  // ----------------------------
  // Fetch Popular Movies
  // ----------------------------

  const fetchPopularMovies = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/popular"
      );

      const data = await response.json();

      if (data.success) {
        setPopularMovies(data.movies);
      }
    } catch (error) {
      console.error("Popular movies error:", error);
    }
  };

  // ----------------------------
  // Toggle Favorite
  // ----------------------------

  const toggleFavorite = (movie) => {
    const exists = favorites.find(
      (m) => m.tmdb_id === movie.tmdb_id
    );

    let updatedFavorites;

    if (exists) {
      updatedFavorites = favorites.filter(
        (m) => m.tmdb_id !== movie.tmdb_id
      );
    } else {
      updatedFavorites = [...favorites, movie];
    }

    setFavorites(updatedFavorites);

    localStorage.setItem(
      "favorites",
      JSON.stringify(updatedFavorites)
    );
  };

  // ----------------------------
  // AI Recommendation
  // ----------------------------

  const getRecommendations = async () => {
    if (!movie.trim()) {
      alert("Please enter a movie name.");
      return;
    }

    setLoading(true);
    setRecommendations([]);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/recommend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            movie: movie.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setRecommendations(data.recommendations);
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Sort Popular Movies
  // ----------------------------

  const sortedPopularMovies = [...popularMovies].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.rating || 0) - (a.rating || 0);

      case "newest":
        return (
          new Date(b.release_date || 0) -
          new Date(a.release_date || 0)
        );

      case "oldest":
        return (
          new Date(a.release_date || 0) -
          new Date(b.release_date || 0)
        );

      case "az":
        return (a.title || "").localeCompare(b.title || "");

      case "za":
        return (b.title || "").localeCompare(a.title || "");

      default:
        return (b.popularity || 0) - (a.popularity || 0);
    }
  });

  return (
    <div className="container">
      <Hero />

      <SearchBar
        movie={movie}
        setMovie={setMovie}
        getRecommendations={getRecommendations}
        loading={loading}
      />

      {loading && <Loader />}

      {/* 🔥 Popular Movies */}

      {popularMovies.length > 0 && (
        <>
          <div className="section-header">

            <h2 className="section-title">
              🔥 Popular Movies
            </h2>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popularity">
                🔥 Popularity
              </option>

              <option value="rating">
                ⭐ Rating
              </option>

              <option value="newest">
                🆕 Newest
              </option>

              <option value="oldest">
                📅 Oldest
              </option>

              <option value="az">
                A → Z
              </option>

              <option value="za">
                Z → A
              </option>

            </select>

          </div>

          <div className="movie-row">

            {sortedPopularMovies.map((movie) => (

              <MovieCard
                key={movie.tmdb_id}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
              />

            ))}

          </div>

        </>
      )}

      {/* ❤️ Favorites */}

      {favorites.length > 0 && (
        <>
          <h2 className="section-title">
            ❤️ My Favorites
          </h2>

          <div className="movie-row">

            {favorites.map((movie) => (

              <MovieCard
                key={movie.tmdb_id}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
              />

            ))}

          </div>
        </>
      )}

      {/* 🤖 AI Recommendations */}

      {recommendations.length > 0 && (
        <>
          <h2 className="section-title">
            🤖 AI Recommendations
          </h2>

          <div className="movie-row">

            {recommendations.map((movie) => (

              <MovieCard
                key={movie.tmdb_id}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
              />

            ))}

          </div>
        </>
      )}

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <footer className="footer">

        <p>
          🎬 AI Movie Recommendation System
        </p>

        <p>
          Built with ❤️ using <strong>React</strong>,
          <strong> Flask</strong> &{" "}
          <strong>TMDB API</strong>
        </p>

        <p>
          © 2026 All Rights Reserved
        </p>

      </footer>

    </div>
  );
}

export default App;