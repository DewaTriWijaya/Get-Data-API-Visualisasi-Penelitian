-- CREATE DATABASE penelitian_unikom
-- CHARACTER SET utf8mb4
-- COLLATE utf8mb4_unicode_ci;

USE penelitian_unikom;

CREATE TABLE institutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openalex_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL
);

INSERT INTO institutions (openalex_id, name)
VALUES ('I4210117444', 'Universitas Komputer Indonesia');

CREATE TABLE lecturers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  orcid VARCHAR(50),
  openalex_author_id VARCHAR(50) UNIQUE,
  works_count INT DEFAULT 0,
  cited_by_count INT DEFAULT 0,
  institution_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE publications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT NOT NULL,
  publication_year INT,
  doi VARCHAR(255),
  citations INT DEFAULT 0,
  lecturer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id)
);

INSERT IGNORE INTO lecturers
(name, orcid, openalex_author_id, works_count, cited_by_count, institution_id)
VALUES
('Ahmad Fauzi', '0000-0002-1234-5678', 'A123456789', 12, 45, 1);

INSERT INTO publications
(title, publication_year, doi, citations, lecturer_id)
VALUES
('Machine Learning for Education', 2023, '10.1234/abc123', 10, 1);


