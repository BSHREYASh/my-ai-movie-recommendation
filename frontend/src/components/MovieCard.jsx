function MovieCard({ movie, onClick }) {
  return (
    <div
      className="movie-card"
      onClick={onClick}
    >

      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          className="movie-poster"
        />
      ) : (
        <div className="no-poster">
          No Poster
        </div>
      )}

      <div className="movie-content">

        <h2>{movie.title}</h2>

        <div className="movie-info">

          <span>
            ⭐ {movie.rating ? movie.rating.toFixed(1) : "N/A"}
          </span>

          <span>
            📅 {movie.release_date
              ? movie.release_date.substring(0, 4)
              : "Unknown"}
          </span>

        </div>

        <p className="overview">
          {movie.overview
            ? movie.overview.length > 180
              ? movie.overview.substring(0, 180) + "..."
              : movie.overview
            : "No overview available."}
        </p>

      </div>

    </div>
  );
}

export default MovieCard;