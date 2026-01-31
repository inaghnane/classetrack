-- ====================================
-- DONNÉES DE TEST - module ET AFFECTATIONS PROF
-- ====================================

USE classetrack;

SET @filiereInf = (SELECT id FROM Filiere WHERE code = 'INF');
SET @filiereGP = (SELECT id FROM Filiere WHERE code = 'GP');

-- Créer module
INSERT INTO Module (id, name, code, filiereId) 
VALUES
  (UUID(), 'Programmation I', 'PROG101', @filiereInf),
  (UUID(), 'Bases de Données', 'BDD101', @filiereInf),
  (UUID(), 'Gestion Agile', 'GAG101', @filiereGP);

-- Récupérer les IDs
SET @profId = (SELECT id FROM User WHERE email = 'prof@classetrack.com');
SET @module1 = (SELECT id FROM Module WHERE code = 'PROG101');
SET @module2 = (SELECT id FROM Module WHERE code = 'BDD101');
SET @module3 = (SELECT id FROM Module WHERE code = 'GAG101');

-- Assigner le prof aux module
INSERT INTO ProfessorTeaching (id, professorId, filiereId, moduleId) 
VALUES
  (UUID(), @profId, @filiereInf, @module1),
  (UUID(), @profId, @filiereInf, @module2),
  (UUID(), @profId, @filiereGP, @module3);

SELECT 'ℹ️ module créés' as MESSAGE;
SELECT name as Module, code as Code FROM Module;

SELECT '' as '';
SELECT 'ℹ️ Professeur assigné aux module' as MESSAGE;
SELECT 'prof@classetrack.com' as Professeur, (SELECT COUNT(*) FROM ProfessorTeaching WHERE professorId = @profId) as 'module assignés';
