ALTER TABLE `transferencias_materias_primas`
  ADD COLUMN `data_transferencia` timestamp NOT NULL,
  ADD COLUMN `quantidade` float NOT NULL,
  ADD COLUMN `unidade` enum('kg','lt','ton') NOT NULL DEFAULT 'kg',
  ADD COLUMN `responsavel` varchar(150) NOT NULL,
  ADD COLUMN `motivo` text NOT NULL;
