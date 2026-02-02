/*
  Warnings:

  - You are about to drop the column `academicYearId` on the `groupe` table. All the data in the column will be lost.
  - You are about to drop the column `niveau` on the `groupe` table. All the data in the column will be lost.
  - You are about to drop the column `academicYearId` on the `module` table. All the data in the column will be lost.
  - You are about to drop the column `niveau` on the `module` table. All the data in the column will be lost.
  - You are about to drop the `academic_year` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `filiere_academic_year` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,filiereId]` on the table `groupe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,filiereId]` on the table `module` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `attendance_seanceId_fkey` ON `attendance`;

-- DropIndex
DROP INDEX `enrollment_groupeId_fkey` ON `enrollment`;

-- DropIndex
DROP INDEX `groupe_academicYearId_fkey` ON `groupe`;

-- DropIndex
DROP INDEX `groupe_filiereId_fkey` ON `groupe`;

-- DropIndex
DROP INDEX `groupe_name_filiereId_academicYearId_key` ON `groupe`;

-- DropIndex
DROP INDEX `justification_seanceId_fkey` ON `justification`;

-- DropIndex
DROP INDEX `module_academicYearId_fkey` ON `module`;

-- DropIndex
DROP INDEX `module_filiereId_fkey` ON `module`;

-- DropIndex
DROP INDEX `module_name_filiereId_academicYearId_key` ON `module`;

-- DropIndex
DROP INDEX `professorassignment_groupeId_fkey` ON `professorassignment`;

-- DropIndex
DROP INDEX `professorassignment_moduleId_fkey` ON `professorassignment`;

-- DropIndex
DROP INDEX `professorteaching_moduleId_fkey` ON `professorteaching`;

-- DropIndex
DROP INDEX `seance_filiereId_fkey` ON `seance`;

-- DropIndex
DROP INDEX `seance_groupeId_fkey` ON `seance`;

-- DropIndex
DROP INDEX `seance_moduleId_fkey` ON `seance`;

-- DropIndex
DROP INDEX `seance_profId_fkey` ON `seance`;

-- AlterTable
ALTER TABLE `groupe` DROP COLUMN `academicYearId`,
    DROP COLUMN `niveau`;

-- AlterTable
ALTER TABLE `module` DROP COLUMN `academicYearId`,
    DROP COLUMN `niveau`;

-- DropTable
DROP TABLE `academic_year`;

-- DropTable
DROP TABLE `filiere_academic_year`;

-- CreateIndex
CREATE UNIQUE INDEX `groupe_name_filiereId_key` ON `groupe`(`name`, `filiereId`);

-- CreateIndex
CREATE UNIQUE INDEX `module_name_filiereId_key` ON `module`(`name`, `filiereId`);

-- AddForeignKey
ALTER TABLE `groupe` ADD CONSTRAINT `groupe_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `filiere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module` ADD CONSTRAINT `module_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `filiere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professorteaching` ADD CONSTRAINT `professorteaching_profId_fkey` FOREIGN KEY (`profId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professorteaching` ADD CONSTRAINT `professorteaching_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professorassignment` ADD CONSTRAINT `professorassignment_profId_fkey` FOREIGN KEY (`profId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professorassignment` ADD CONSTRAINT `professorassignment_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professorassignment` ADD CONSTRAINT `professorassignment_groupeId_fkey` FOREIGN KEY (`groupeId`) REFERENCES `groupe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seance` ADD CONSTRAINT `seance_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `filiere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seance` ADD CONSTRAINT `seance_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seance` ADD CONSTRAINT `seance_groupeId_fkey` FOREIGN KEY (`groupeId`) REFERENCES `groupe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seance` ADD CONSTRAINT `seance_profId_fkey` FOREIGN KEY (`profId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `enrollment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `enrollment_groupeId_fkey` FOREIGN KEY (`groupeId`) REFERENCES `groupe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_seanceId_fkey` FOREIGN KEY (`seanceId`) REFERENCES `seance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `justification` ADD CONSTRAINT `justification_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `justification` ADD CONSTRAINT `justification_seanceId_fkey` FOREIGN KEY (`seanceId`) REFERENCES `seance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
