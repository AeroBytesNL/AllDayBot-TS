CREATE TABLE IF NOT EXISTS `migrations` (
                                            `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                            `name` TEXT NOT NULL,
                                            `run_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
