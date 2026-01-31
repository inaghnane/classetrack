-- ====================================
-- DONNÉES DE TEST - filière ET groupe
-- ====================================

USE classetrack;

-- Créer filière
INSERT INTO Filiere (id, name, code) 
VALUES 
  (UUID(), 'Informatique', 'INF'),
  (UUID(), 'Gestion de Projet', 'GP');

-- Récupérer les IDs des filière
SET @filiereInf = (SELECT id FROM Filiere WHERE code = 'INF');
SET @filiereGP = (SELECT id FROM Filiere WHERE code = 'GP');

-- Créer groupe
INSERT INTO Groupe (id, name, filiereId) 
VALUES
  (UUID(), 'INF-G1', @filiereInf),
  (UUID(), 'INF-G2', @filiereInf),
  (UUID(), 'GP-G1', @filiereGP);

SELECT 'ℹ️ filière créées' as MESSAGE;
SELECT name as Filière, code as Code FROM Filiere;

SELECT '' as '';
SELECT 'ℹ️ groupe créés' as MESSAGE;
SELECT name as Groupe FROM Groupe;
