-- ====================================
-- ClasseTrack - Schéma des tables
-- ====================================

-- Supprimer et recréer la base
DROP DATABASE IF EXISTS classetrack;
CREATE DATABASE classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE classetrack;

-- ====================================
-- Table User
-- ====================================
CREATE TABLE User (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  role ENUM('ADMIN', 'PROF', 'STUDENT') NOT NULL,
  deviceId VARCHAR(191),
  deviceBoundAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table Filiere
-- ====================================
CREATE TABLE Filiere (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table Groupe
-- ====================================
CREATE TABLE Groupe (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  filiereId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filiereId) REFERENCES Filiere(id) ON DELETE CASCADE,
  UNIQUE KEY unique_filiere_groupe (filiereId, name),
  INDEX idx_filiere (filiereId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table Module
-- ====================================
CREATE TABLE Module (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  filiereId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filiereId) REFERENCES Filiere(id) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_filiere (filiereId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table ProfessorTeaching
-- ====================================
CREATE TABLE ProfessorTeaching (
  id VARCHAR(36) PRIMARY KEY,
  professorId VARCHAR(36) NOT NULL,
  filiereId VARCHAR(36) NOT NULL,
  moduleId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professorId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (filiereId) REFERENCES Filiere(id) ON DELETE CASCADE,
  FOREIGN KEY (moduleId) REFERENCES Module(id) ON DELETE CASCADE,
  UNIQUE KEY unique_prof_module (professorId, moduleId),
  INDEX idx_professor (professorId),
  INDEX idx_module (moduleId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table Enrollment
-- ====================================
CREATE TABLE Enrollment (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  groupeId VARCHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (groupeId) REFERENCES Groupe(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_groupe (studentId, groupeId),
  INDEX idx_student (studentId),
  INDEX idx_groupe (groupeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table Seance
-- ====================================
CREATE TABLE Seance (
  id VARCHAR(36) PRIMARY KEY,
  moduleId VARCHAR(36) NOT NULL,
  professorId VARCHAR(36) NOT NULL,
  groupeId VARCHAR(36) NOT NULL,
  startsAt DATETIME NOT NULL,
  endsAt DATETIME NOT NULL,
  openedAt DATETIME,
  closedAt DATETIME,
  room VARCHAR(50) NOT NULL,
  status ENUM('PLANNED', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'PLANNED',
  qrSecret VARCHAR(191),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moduleId) REFERENCES Module(id) ON DELETE CASCADE,
  FOREIGN KEY (professorId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (groupeId) REFERENCES Groupe(id) ON DELETE CASCADE,
  INDEX idx_module (moduleId),
  INDEX idx_professor (professorId),
  INDEX idx_groupe (groupeId),
  INDEX idx_status (status),
  INDEX idx_starts (startsAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table Attendance
-- ====================================
CREATE TABLE Attendance (
  id VARCHAR(36) PRIMARY KEY,
  seanceId VARCHAR(36) NOT NULL,
  studentId VARCHAR(36) NOT NULL,
  status ENUM('PRESENT', 'ABSENT') NOT NULL,
  source ENUM('QR', 'MANUAL') NOT NULL,
  markedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  markedById VARCHAR(36),
  note TEXT,
  FOREIGN KEY (seanceId) REFERENCES Seance(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (markedById) REFERENCES User(id),
  UNIQUE KEY unique_seance_student (seanceId, studentId),
  INDEX idx_seance (seanceId),
  INDEX idx_student (studentId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Table Justification
-- ====================================
CREATE TABLE Justification (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  seanceId VARCHAR(36) NOT NULL,
  moduleId VARCHAR(36) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileType VARCHAR(50) NOT NULL,
  justificationType ENUM('CERTIFICAT', 'DOSSIER_MEDICAL') NOT NULL,
  status ENUM('SUBMITTED', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  comment TEXT,
  submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewedById VARCHAR(36),
  reviewedAt DATETIME,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (seanceId) REFERENCES Seance(id) ON DELETE CASCADE,
  FOREIGN KEY (moduleId) REFERENCES Module(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewedById) REFERENCES User(id),
  UNIQUE KEY unique_seance_student (seanceId, studentId),
  INDEX idx_student (studentId),
  INDEX idx_seance (seanceId),
  INDEX idx_module (moduleId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
