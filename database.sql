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
DROP TABLE IF EXISTS `seances`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `modules`;
DROP TABLE IF EXISTS `groupes`;
DROP TABLE IF EXISTS `filieres`;
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- Table: users
-- =====================================================
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'PROF', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`),
    INDEX `users_role_idx` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: filieres
-- =====================================================
CREATE TABLE `filieres` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `filieres_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: groupes
-- =====================================================
CREATE TABLE `groupes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filiereId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `groupes_name_filiereId_unique` (`name`, `filiereId`),
    INDEX `groupes_filiereId_idx` (`filiereId`),
    
    CONSTRAINT `groupes_filiereId_fkey` 
        FOREIGN KEY (`filiereId`) 
        REFERENCES `filieres`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: modules
-- =====================================================
CREATE TABLE `modules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filiereId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `modules_name_filiereId_unique` (`name`, `filiereId`),
    INDEX `modules_filiereId_idx` (`filiereId`),
    
    CONSTRAINT `modules_filiereId_fkey` 
        FOREIGN KEY (`filiereId`) 
        REFERENCES `filieres`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: enrollments
-- =====================================================
CREATE TABLE `enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `groupeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `enrollments_studentId_groupeId_unique` (`studentId`, `groupeId`),
    INDEX `enrollments_studentId_idx` (`studentId`),
    INDEX `enrollments_groupeId_idx` (`groupeId`),
    
    CONSTRAINT `enrollments_studentId_fkey` 
        FOREIGN KEY (`studentId`) 
        REFERENCES `users`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `enrollments_groupeId_fkey` 
        FOREIGN KEY (`groupeId`) 
        REFERENCES `groupes`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: seances
-- =====================================================
CREATE TABLE `seances` (
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
    INDEX `seances_moduleId_idx` (`moduleId`),
    INDEX `seances_professorId_idx` (`professorId`),
    INDEX `seances_groupeId_idx` (`groupeId`),
    INDEX `seances_status_idx` (`status`),
    INDEX `seances_startsAt_idx` (`startsAt`),
    
    CONSTRAINT `seances_moduleId_fkey` 
        FOREIGN KEY (`moduleId`) 
        REFERENCES `modules`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `seances_professorId_fkey` 
        FOREIGN KEY (`professorId`) 
        REFERENCES `users`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `seances_groupeId_fkey` 
        FOREIGN KEY (`groupeId`) 
        REFERENCES `groupes`(`id`) 
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
        REFERENCES `seances`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `attendances_studentId_fkey` 
        FOREIGN KEY (`studentId`) 
        REFERENCES `users`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert sample data (optional)
-- =====================================================

-- Sample Admin User (password: admin123)
-- You should change this password in production
INSERT INTO `users` (`id`, `email`, `passwordHash`, `firstName`, `lastName`, `role`) VALUES
('admin001', 'admin@classetrack.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'System', 'ADMIN');

-- =====================================================
-- End of script
-- =====================================================
