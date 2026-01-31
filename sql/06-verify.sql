-- ====================================
-- VÉRIFICATION COMPLÈTE DES DONNÉES
-- ====================================

USE classetrack;

SELECT '' as '';
SELECT '========================================' as '';
SELECT '✓ Base de données créée avec succès!' as MESSAGE;
SELECT '========================================' as '';
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'RÉSUMÉ DES DONNÉES' as MESSAGE;
SELECT '========================================' as '';
SELECT '' as '';

SELECT CONCAT('👥 user: ', COUNT(*)) as STATS FROM User;
SELECT CONCAT('🏛️  filière: ', COUNT(*)) as STATS FROM Filiere;
SELECT CONCAT('👥 groupe: ', COUNT(*)) as STATS FROM Groupe;
SELECT CONCAT('📚 module: ', COUNT(*)) as STATS FROM Module;
SELECT CONCAT('📅 Séances: ', COUNT(*)) as STATS FROM Seance;
SELECT CONCAT('📝 Inscriptions: ', COUNT(*)) as STATS FROM Enrollment;

SELECT '' as '';
SELECT '========================================' as '';
SELECT 'COMPTES DE TEST' as MESSAGE;
SELECT '========================================' as '';
SELECT CONCAT(firstName, ' ', lastName) as Nom, email as Email, role as Rôle FROM User ORDER BY role;
