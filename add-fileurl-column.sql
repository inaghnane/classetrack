-- Ajouter la colonne fileUrl à la table justification
ALTER TABLE justification 
ADD COLUMN fileUrl VARCHAR(500) NULL AFTER reason;

-- Vérifier que la colonne a été ajoutée
DESCRIBE justification;
