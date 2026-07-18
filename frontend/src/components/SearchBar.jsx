import { useState, useEffect } from "react";

function SearchBar({
  movie,
  setMovie,
  getRecommendations,
  loading,
}) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!movie.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://ai-movie-recommendation-system-iq1e.onrender.com/search?q=${encodeURIComponent(movie)}`
        );

        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [movie]);

  const selectMovie = (title) => {
    setMovie(title);
    setSuggestions([]);
  };

  return (
    <div className="search-wrapper">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search movie..."
          value={movie}
          onChange={(e) => setMovie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSuggestions([]);
              getRecommendations();
            }
          }}
        />

        <button
          onClick={() => {
            setSuggestions([]);
            getRecommendations();
          }}
          disabled={loading}
        >
          {loading ? "Loading..." : "Recommend"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((title) => (
            <div
              key={title}
              className="autocomplete-item"
              onClick={() => selectMovie(title)}
            >
              🎬 {title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;