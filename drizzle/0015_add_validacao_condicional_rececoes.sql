ALTER TABLE `rececoes_materias_primas`
  ADD COLUMN `estado_validacao` ENUM('nao_aplicavel', 'pendente', 'validada', 'recusada') NOT NULL DEFAULT 'nao_aplicavel' AFTER `conformidade`;

ALTER TABLE `rececoes_materias_primas`
  ADD COLUMN `motivo_validacao_condicional` TEXT NULL,
  ADD COLUMN `validado_por` INT NULL,
  ADD COLUMN `validado_por_nome` VARCHAR(200) NULL,
  ADD COLUMN `validado_em` TIMESTAMP NULL;

ALTER TABLE `rececoes_materias_primas`
  ADD CONSTRAINT `fk_rececoes_validado_por` FOREIGN KEY (`validado_por`) REFERENCES `users`(`id`);

ALTER TABLE `notificacoes_qualidade`
  MODIFY COLUMN `tipo` ENUM('rececao_observacoes', 'rececao_validacao_condicional') NOT NULL DEFAULT 'rececao_observacoes';
