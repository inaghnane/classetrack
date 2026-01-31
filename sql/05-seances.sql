-- ====================================
-- DONNÉES DE TEST - INSCRIPTIONS ÉTUDIANTS ET SÉANCES
-- ====================================

USE classetrack;

-- Récupérer les IDs
SET @studentId = (SELECT id FROM User WHERE email = 'student@classetrack.com');
SET @groupe1 = (SELECT id FROM Groupe WHERE name = 'INF-G1');
SET @groupe3 = (SELECT id FROM Groupe WHERE name = 'GP-G1');
SET @profId = (SELECT id FROM User WHERE email = 'prof@classetrack.com');
SET @module1 = (SELECT id FROM Module WHERE code = 'PROG101');
SET @module2 = (SELECT id FROM Module WHERE code = 'BDD101');
SET @module3 = (SELECT id FROM Module WHERE code = 'GAG101');

-- Inscrire l'étudiant aux groupe
INSERT INTO Enrollment (id, studentId, groupeId) 
VALUES
  (UUID(), @studentId, @groupe1),
  (UUID(), @studentId, @groupe3);

-- Créer les séances
INSERT INTO Seance (id, moduleId, professorId, groupeId, startsAt, endsAt, room, status) 
VALUES
  (UUID(), @module1, @profId, @groupe1, NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY + INTERVAL 2 HOUR, 'Salle A101', 'PLANNED'),
  (UUID(), @module2, @profId, @groupe1, NOW() + INTERVAL 2 DAY, NOW() + INTERVAL 2 DAY + INTERVAL 2 HOUR, 'Salle A102', 'PLANNED'),
  (UUID(), @module3, @profId, @groupe3, NOW() + INTERVAL 3 DAY, NOW() + INTERVAL 3 DAY + INTERVAL 2 HOUR, 'Salle B201', 'PLANNED');

SELECT 'ℹ️ Étudiant inscrit aux groupe' as MESSAGE;
SELECT 'student@classetrack.com' as Étudiant, COUNT(*) as 'groupe' FROM Enrollment WHERE studentId = @studentId;

SELECT '' as '';
SELECT 'ℹ️ Séances créées' as MESSAGE;
SELECT room as Salle, DATE_FORMAT(startsAt, '%d/%m/%Y %H:%i') as Début, status as Statut FROM Seance;
