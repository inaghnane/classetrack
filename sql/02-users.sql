-- ====================================
-- DONNÉES DE TEST - UTILISATEURS
-- ====================================

USE classetrack;

-- Créer ADMIN (email: admin@classetrack.com, password: admin123)
INSERT INTO User (id, email, passwordHash, firstName, lastName, role) 
VALUES (UUID(), 'admin@classetrack.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'ADMIN');

-- Créer PROF (email: prof@classetrack.com, password: prof123)
INSERT INTO User (id, email, passwordHash, firstName, lastName, role) 
VALUES (UUID(), 'prof@classetrack.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Professeur', 'Dupont', 'PROF');

-- Créer ÉTUDIANT (email: student@classetrack.com, password: student123)
INSERT INTO User (id, email, passwordHash, firstName, lastName, role) 
VALUES (UUID(), 'student@classetrack.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'Jean', 'Martin', 'STUDENT');

SELECT 'ℹ️ Utilisateurs créés' as MESSAGE;
SELECT CONCAT(firstName, ' ', lastName) as Nom, email as Email, role as Rôle FROM User ORDER BY role;
