-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(25) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'PROF', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `deviceId` VARCHAR(100) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_year` (
    `id` VARCHAR(25) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `academic_year_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `filiere_academic_year` (
    `id` VARCHAR(25) NOT NULL,
    `filiereId` VARCHAR(25) NOT NULL,
    `academicYearId` VARCHAR(25) NOT NULL,
    `niveau` ENUM('L1', 'L2', 'L3', 'M1', 'M2') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `filiere_academic_year_filiereId_academicYearId_niveau_key`(`filiereId`, `academicYearId`, `niveau`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `filiere` (
    `id` VARCHAR(25) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `filiere_name_key`(`name`),
    UNIQUE INDEX `filiere_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groupe` (
    `id` VARCHAR(25) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `filiereId` VARCHAR(25) NOT NULL,
    `academicYearId` VARCHAR(25) NOT NULL,
    `niveau` ENUM('L1', 'L2', 'L3', 'M1', 'M2') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `groupe_code_key`(`code`),
    UNIQUE INDEX `groupe_name_filiereId_academicYearId_key`(`name`, `filiereId`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module` (
    `id` VARCHAR(25) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `filiereId` VARCHAR(25) NOT NULL,
    `academicYearId` VARCHAR(25) NOT NULL,
    `niveau` ENUM('L1', 'L2', 'L3', 'M1', 'M2') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `module_code_key`(`code`),
    UNIQUE INDEX `module_name_filiereId_academicYearId_key`(`name`, `filiereId`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professorteaching` (
    `id` VARCHAR(25) NOT NULL,
    `profId` VARCHAR(25) NOT NULL,
    `moduleId` VARCHAR(25) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `professorteaching_profId_moduleId_key`(`profId`, `moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professorassignment` (
    `id` VARCHAR(25) NOT NULL,
    `profId` VARCHAR(25) NOT NULL,
    `moduleId` VARCHAR(25) NOT NULL,
    `groupeId` VARCHAR(25) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `professorassignment_profId_moduleId_groupeId_key`(`profId`, `moduleId`, `groupeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seance` (
    `id` VARCHAR(25) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(10) NOT NULL,
    `endTime` VARCHAR(10) NOT NULL,
    `status` ENUM('PLANNED', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'PLANNED',
    `qrSecret` VARCHAR(255) NULL,
    `qrFrozen` BOOLEAN NOT NULL DEFAULT false,
    `confirmed` BOOLEAN NOT NULL DEFAULT false,
    `filiereId` VARCHAR(25) NOT NULL,
    `moduleId` VARCHAR(25) NOT NULL,
    `groupeId` VARCHAR(25) NOT NULL,
    `profId` VARCHAR(25) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollment` (
    `id` VARCHAR(25) NOT NULL,
    `studentId` VARCHAR(25) NOT NULL,
    `groupeId` VARCHAR(25) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `enrollment_studentId_groupeId_key`(`studentId`, `groupeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(25) NOT NULL,
    `studentId` VARCHAR(25) NOT NULL,
    `seanceId` VARCHAR(25) NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL DEFAULT 'ABSENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendance_studentId_seanceId_key`(`studentId`, `seanceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `justification` (
    `id` VARCHAR(25) NOT NULL,
    `studentId` VARCHAR(25) NOT NULL,
    `seanceId` VARCHAR(25) NOT NULL,
    `reason` TEXT NOT NULL,
    `fileUrl` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `adminComment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `justification_studentId_seanceId_key`(`studentId`, `seanceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `filiere_academic_year` ADD CONSTRAINT `filiere_academic_year_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `filiere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `filiere_academic_year` ADD CONSTRAINT `filiere_academic_year_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groupe` ADD CONSTRAINT `groupe_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `filiere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groupe` ADD CONSTRAINT `groupe_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module` ADD CONSTRAINT `module_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `filiere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module` ADD CONSTRAINT `module_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
