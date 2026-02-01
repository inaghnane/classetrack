-- Ajouter la colonne filiereId à la table seance
ALTER TABLE seance ADD COLUMN filiereId VARCHAR(25);

-- Remplir filiereId en récupérant la filière depuis le module
UPDATE seance s
JOIN module m ON s.moduleId = m.id
SET s.filiereId = m.filiereId;

-- Rendre la colonne obligatoire une fois remplie
ALTER TABLE seance MODIFY COLUMN filiereId VARCHAR(25) NOT NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE seance ADD CONSTRAINT seance_filiereId_fkey 
  FOREIGN KEY (filiereId) REFERENCES filiere(id) ON DELETE CASCADE;
