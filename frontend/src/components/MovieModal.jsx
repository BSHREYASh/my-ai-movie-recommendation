function MovieModal({
  movie,
  onClose,
  favorites,
  toggleFavorite,
}) {
  if (!movie) return null;

  const isFavorite = favorites.some(
    (m) => m.tmdb_id === movie.tmdb_id
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        <img
          src={movie.poster}
          alt={movie.title}
          className="modal-poster"
        />

        <div className="modal-info">
          <h2>{movie.title}</h2>

          <div className="movie-meta">
            <span>
              ⭐ {movie.rating ? movie.rating.toFixed(1) : "N/A"}
            </span>

            <span>
              📅{" "}
              {movie.release_date
                ? movie.release_date.substring(0, 4)
                : "Unknown"}
            </span>

            <span>🌍 {movie.language}</span>
          </div>

          <p className="overview-full">
            {movie.overview || "No overview available."}
          </p>

          <div className="extra-info">
            <p>
              <strong>🔥 Popularity:</strong>{" "}
              {movie.popularity
                ? Math.round(movie.popularity)
                : "N/A"}
            </p>

            <p>
              <strong>🗳 Votes:</strong>{" "}
              {movie.vote_count || "N/A"}
            </p>

            <p>
              <strong>🔞 Adult:</strong>{" "}
              {movie.adult ? "Yes" : "No"}
            </p>
          </div>

          <div className="modal-buttons">
            {movie.trailer && (
              <a
                href={movie.trailer}
                target="_blank"
                rel="noopener noreferrer"
                className="trailer-btn"
              >
                ▶ Watch Trailer
              </a>
            )}

            <button
              className="favorite-btn"
              onClick={() => toggleFavorite(movie)}
            >
              {isFavorite
                ? "💔 Remove Favorite"
                : "❤️ Add to Favorites"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;