-- 권한 테이블 --
CREATE TABLE `tb_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT 'SYSTEM',
  `updated_by` varchar(50) DEFAULT 'SYSTEM',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 유저 테이블 --
CREATE TABLE `tb_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` bigint NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `is_delete_yn` char(1) DEFAULT 'N',
  `first_login_yn` char(1) DEFAULT 'N',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT 'SYSTEM',
  `updated_by` varchar(50) DEFAULT 'SYSTEM',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `tb_user_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `tb_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- 프로젝트 테이블 --
CREATE TABLE `tb_project` (
  `project_code` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `business_start_date` date NOT NULL,
  `business_end_date` date NOT NULL,
  `project_name` text NOT NULL,
  `customer` varchar(255) DEFAULT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `person_in_charge` varchar(255) DEFAULT NULL,
  `contact_number` varchar(255) DEFAULT NULL,
  `sales_representative` varchar(255) DEFAULT NULL,
  `project_pm` varchar(255) NOT NULL,
  `project_manager` varchar(255) DEFAULT NULL,
  `business_details_and_notes` text,
  `changes` text,
  `group_name` varchar(255) DEFAULT NULL,
  `is_delete_yn` char(1) DEFAULT 'N',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT 'SYSTEM',
  `updated_by` varchar(50) DEFAULT 'SYSTEM',
  PRIMARY KEY (`project_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 프로젝트 유저 테이블 --
CREATE TABLE `tb_project_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_code` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  `current_project_yn` char(1) DEFAULT 'N',
  `is_delete_yn` char(1) DEFAULT 'N',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT 'SYSTEM',
  `updated_by` varchar(50) DEFAULT 'SYSTEM',
  PRIMARY KEY (`id`),
  KEY `project_code` (`project_code`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `tb_project_user_ibfk_1` FOREIGN KEY (`project_code`) REFERENCES `tb_project` (`project_code`),
  CONSTRAINT `tb_project_user_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 일정 테이블 --
CREATE TABLE `tb_schedule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `task` varchar(255) NOT NULL,
  `status` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `tb_schedule_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 즐겨찾기 테이블 --
CREATE TABLE `tb_favorite` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `favorite_user_id` bigint NOT NULL,
  `is_favorite_yn` char(1) DEFAULT 'N',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `favorite_user_id` (`favorite_user_id`),
  CONSTRAINT `tb_favorite_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`),
  CONSTRAINT `tb_favorite_ibfk_2` FOREIGN KEY (`favorite_user_id`) REFERENCES `tb_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

