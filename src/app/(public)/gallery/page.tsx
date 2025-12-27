"use client";

import { useState } from "react";

/**
 * Photo album type
 */
type PhotoAlbum = {
  id: string;
  eventName: string;
  eventDate: string;
  thumbnailUrl: string;
  photoCount: number;
  year: number;
};

/**
 * Photo type for expanded view
 */
type Photo = {
  id: string;
  url: string;
  caption: string | null;
};

/**
 * Public Photo Gallery Page
 *
 * Displays event photo albums with:
 * - Grid of album thumbnails
 * - Event name and date
 * - Photo count per album
 * - Click to expand album
 * - Filter by year
 *
 * Uses mock data for demonstration.
 */
export default function GalleryPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);

  // Mock data for demonstration
  const albums: PhotoAlbum[] = [
    {
      id: "album-1",
      eventName: "Holiday Gala 2024",
      eventDate: "December 14, 2024",
      thumbnailUrl: "",
      photoCount: 48,
      year: 2024,
    },
    {
      id: "album-2",
      eventName: "Wine Tasting Tour",
      eventDate: "November 8, 2024",
      thumbnailUrl: "",
      photoCount: 32,
      year: 2024,
    },
    {
      id: "album-3",
      eventName: "Fall Potluck",
      eventDate: "October 19, 2024",
      thumbnailUrl: "",
      photoCount: 24,
      year: 2024,
    },
    {
      id: "album-4",
      eventName: "Summer BBQ",
      eventDate: "July 20, 2024",
      thumbnailUrl: "",
      photoCount: 56,
      year: 2024,
    },
    {
      id: "album-5",
      eventName: "Spring Garden Tour",
      eventDate: "April 13, 2024",
      thumbnailUrl: "",
      photoCount: 38,
      year: 2024,
    },
    {
      id: "album-6",
      eventName: "New Year Brunch 2024",
      eventDate: "January 6, 2024",
      thumbnailUrl: "",
      photoCount: 22,
      year: 2024,
    },
    {
      id: "album-7",
      eventName: "Holiday Gala 2023",
      eventDate: "December 9, 2023",
      thumbnailUrl: "",
      photoCount: 45,
      year: 2023,
    },
    {
      id: "album-8",
      eventName: "Thanksgiving Potluck",
      eventDate: "November 18, 2023",
      thumbnailUrl: "",
      photoCount: 28,
      year: 2023,
    },
  ];

  // Mock photos for expanded album view
  const mockPhotos: Photo[] = Array.from({ length: 12 }, (_, i) => ({
    id: `photo-${i + 1}`,
    url: "",
    caption: i % 3 === 0 ? "Club members enjoying the event" : null,
  }));

  const years = [...new Set(albums.map((a) => a.year))].sort((a, b) => b - a);

  const filteredAlbums = selectedYear
    ? albums.filter((a) => a.year === selectedYear)
    : albums;

  const expandedAlbumData = albums.find((a) => a.id === expandedAlbum);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Photo Gallery</h1>
        <p style={styles.subtitle}>Memories from our club events and gatherings</p>
      </header>

      {/* Year Filter */}
      <div style={styles.filterBar}>
        <button
          style={{
            ...styles.filterButton,
            ...(selectedYear === null ? styles.filterButtonActive : {}),
          }}
          onClick={() => setSelectedYear(null)}
        >
          All Years
        </button>
        {years.map((year) => (
          <button
            key={year}
            style={{
              ...styles.filterButton,
              ...(selectedYear === year ? styles.filterButtonActive : {}),
            }}
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Albums Grid */}
      {filteredAlbums.length === 0 ? (
        <div style={styles.emptyState}>No photo albums found for this year.</div>
      ) : (
        <div style={styles.albumsGrid}>
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              style={styles.albumCard}
              onClick={() => setExpandedAlbum(album.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setExpandedAlbum(album.id)}
            >
              <div style={styles.albumThumbnail}>
                <span style={styles.thumbnailIcon}>&#128247;</span>
              </div>
              <div style={styles.albumInfo}>
                <h3 style={styles.albumTitle}>{album.eventName}</h3>
                <div style={styles.albumMeta}>
                  <span>&#128197; {album.eventDate}</span>
                </div>
                <div style={styles.photoCount}>
                  <span style={styles.photoCountIcon}>&#128248;</span>
                  {album.photoCount} photos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Album Modal */}
      {expandedAlbum && expandedAlbumData && (
        <div style={styles.modalOverlay} onClick={() => setExpandedAlbum(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{expandedAlbumData.eventName}</h2>
                <p style={styles.modalSubtitle}>
                  {expandedAlbumData.eventDate} • {expandedAlbumData.photoCount} photos
                </p>
              </div>
              <button
                style={styles.closeButton}
                onClick={() => setExpandedAlbum(null)}
                aria-label="Close"
              >
                &#10005;
              </button>
            </div>
            <div style={styles.photosGrid}>
              {mockPhotos.map((photo) => (
                <div key={photo.id} style={styles.photoItem}>
                  <div style={styles.photoPlaceholder}>
                    <span style={styles.photoIcon}>&#128248;</span>
                  </div>
                  {photo.caption && (
                    <div style={styles.photoCaption}>{photo.caption}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={styles.modalFooter}>
              <p style={styles.footerNote}>
                Demo gallery with placeholder images. Real photos will be loaded from storage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div style={styles.footer}>
        <span style={styles.footerIcon}>&#9432;</span>
        Demo gallery with placeholder data. Photos are added after each event by our
        volunteer photographers.
      </div>
    </div>
  );
}

/**
 * Inline styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "12px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#6b7280",
  },
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
    marginBottom: "32px",
  },
  filterButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    backgroundColor: "#fff",
    color: "#374151",
    cursor: "pointer",
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    color: "#fff",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#6b7280",
    fontSize: "18px",
  },
  albumsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  albumCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  albumThumbnail: {
    height: "180px",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailIcon: {
    fontSize: "64px",
    opacity: 0.4,
  },
  albumInfo: {
    padding: "16px",
  },
  albumTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "8px",
  },
  albumMeta: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  photoCount: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#4b5563",
    fontWeight: "500",
  },
  photoCountIcon: {
    fontSize: "14px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
  },
  closeButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px",
  },
  photosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
    padding: "20px",
  },
  photoItem: {
    position: "relative",
  },
  photoPlaceholder: {
    aspectRatio: "4/3",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  photoIcon: {
    fontSize: "32px",
    opacity: 0.3,
  },
  photoCaption: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center",
  },
  modalFooter: {
    padding: "16px 20px",
    borderTop: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },
  footerNote: {
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
    margin: 0,
  },
  footer: {
    marginTop: "40px",
    padding: "16px 20px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
  },
  footerIcon: {
    fontSize: "16px",
  },
};
