CREATE TABLE `transferencias_materias_primas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `materia_prima_id` int NOT NULL,
  `fabrica_origem_id` int NOT NULL,
  `fabrica_destino_id` int NOT NULL,
  `estado_origem` enum('ativa','para_testes','inativa') NOT NULL,
  `estado_destino` enum('ativa','para_testes','inativa') NOT NULL,
  `manter_na_origem` boolean NOT NULL DEFAULT false,
  `observacoes` text,
  `transferido_por` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `transferencias_mp_pk` PRIMARY KEY(`id`),
  CONSTRAINT `transferencias_mp_materia_prima_fk` FOREIGN KEY (`materia_prima_id`) REFERENCES `materias_primas`(`id`),
  CONSTRAINT `transferencias_mp_fabrica_origem_fk` FOREIGN KEY (`fabrica_origem_id`) REFERENCES `fabricas`(`id`),
  CONSTRAINT `transferencias_mp_fabrica_destino_fk` FOREIGN KEY (`fabrica_destino_id`) REFERENCES `fabricas`(`id`),
  CONSTRAINT `transferencias_mp_user_fk` FOREIGN KEY (`transferido_por`) REFERENCES `users`(`id`)
);
CREATE INDEX `transferencias_mp_materia_prima_idx` ON `transferencias_materias_primas` (`materia_prima_id`);
