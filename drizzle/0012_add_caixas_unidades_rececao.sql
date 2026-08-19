ALTER TABLE `rececoes_materias_primas`
  MODIFY COLUMN `unidade` enum('kg','lt','ton','cx','unid') NOT NULL DEFAULT 'kg';

ALTER TABLE `transferencias_materias_primas`
  MODIFY COLUMN `unidade` enum('kg','lt','ton','cx','unid') NOT NULL DEFAULT 'kg';
