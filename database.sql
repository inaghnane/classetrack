-- =====================================================
-- ClasseTrack Database Schema
-- MariaDB / MySQL Database
-- Generated: 2026-01-27
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE classetrack;

-- =====================================================
-- Drop existing tables (in reverse order of dependencies)
-- =====================================================
DROP TABLE IF EXISTS `attendances`;
DROP TABLE IF EXISTS `seance`;
DROP TABLE IF EXISTS `enrollment`;
DROP TABLE IF EXISTS `module`;
DROP TABLE IF EXISTS `groupe`;
DROP TABLE IF EXISTS `filiere`;
DROP TABLE IF EXISTS `user`;

-- =====================================================
-- Table: user
-- =====================================================
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'PROF', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_email_unique` (`email`),
    INDEX `user_role_idx` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: filiere
-- =====================================================
CREATE TABLE `filiere` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `filiere_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: groupe
-- =====================================================
CREATE TABLE `groupe` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filiereId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `groupe_name_filiereId_unique` (`name`, `filiereId`),
    INDEX `groupe_filiereId_idx` (`filiereId`),
    
    CONSTRAINT `groupe_filiereId_fkey` 
        FOREIGN KEY (`filiereId`) 
        REFERENCES `filiere`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: module
-- =====================================================
CREATE TABLE `module` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filiereId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `module_name_filiereId_unique` (`name`, `filiereId`),
    INDEX `module_filiereId_idx` (`filiereId`),
    
    CONSTRAINT `module_filiereId_fkey` 
        FOREIGN KEY (`filiereId`) 
        REFERENCES `filiere`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: enrollment
-- =====================================================
CREATE TABLE `enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `groupeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `enrollment_studentId_groupeId_unique` (`studentId`, `groupeId`),
    INDEX `enrollment_studentId_idx` (`studentId`),
    INDEX `enrollment_groupeId_idx` (`groupeId`),
    
    CONSTRAINT `enrollment_studentId_fkey` 
        FOREIGN KEY (`studentId`) 
        REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `enrollment_groupeId_fkey` 
        FOREIGN KEY (`groupeId`) 
        REFERENCES `groupe`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: seance
-- =====================================================
CREATE TABLE `seance` (
    `id` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `groupeId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `room` VARCHAR(191) NOT NULL,
    `status` ENUM('PLANNED', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'PLANNED',
    `qrSecret` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    INDEX `seance_moduleId_idx` (`moduleId`),
    INDEX `seance_professorId_idx` (`professorId`),
    INDEX `seance_groupeId_idx` (`groupeId`),
    INDEX `seance_status_idx` (`status`),
    INDEX `seance_startsAt_idx` (`startsAt`),
    
    CONSTRAINT `seance_moduleId_fkey` 
        FOREIGN KEY (`moduleId`) 
        REFERENCES `module`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `seance_professorId_fkey` 
        FOREIGN KEY (`professorId`) 
        REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `seance_groupeId_fkey` 
        FOREIGN KEY (`groupeId`) 
        REFERENCES `groupe`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: attendances
-- =====================================================
CREATE TABLE `attendances` (
    `id` VARCHAR(191) NOT NULL,
    `seanceId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT') NOT NULL,
    `source` ENUM('QR', 'MANUAL') NOT NULL DEFAULT 'QR',
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `attendances_seanceId_studentId_unique` (`seanceId`, `studentId`),
    INDEX `attendances_seanceId_idx` (`seanceId`),
    INDEX `attendances_studentId_idx` (`studentId`),
    INDEX `attendances_status_idx` (`status`),
    
    CONSTRAINT `attendances_seanceId_fkey` 
        FOREIGN KEY (`seanceId`) 
        REFERENCES `seance`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `attendances_studentId_fkey` 
        FOREIGN KEY (`studentId`) 
        REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert sample data (optional)
-- =====================================================

-- Sample Admin User (password: admin123)
-- You should change this password in production
INSERT INTO `user` (`id`, `email`, `passwordHash`, `firstName`, `lastName`, `role`) VALUES
('admin001', 'admin@classetrack.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'System', 'ADMIN');

-- =====================================================
-- End of script
-- =====================================================
