ALTER TABLE `transferencias_materias_primas`
  ADD COLUMN `rececao_origem_id` int NOT NULL;

ALTER TABLE `transferencias_materias_primas`
  ADD CONSTRAINT `transf_mp_rec_origem_fk`
  FOREIGN KEY (`rececao_origem_id`) REFERENCES `rececoes_materias_primas`(`id`);
