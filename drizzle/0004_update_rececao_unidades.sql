ALTER TABLE `rececoes_materias_primas`
  MODIFY COLUMN `unidade` enum('kg','lt','ton') NOT NULL DEFAULT 'kg';
