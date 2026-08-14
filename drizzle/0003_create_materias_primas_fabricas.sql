CREATE TABLE `materias_primas_fabricas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `materia_prima_id` int NOT NULL,
  `fabrica_id` int NOT NULL,
  `estado` enum('ativa','para_testes','inativa') NOT NULL DEFAULT 'ativa',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `materias_primas_fabricas_id` PRIMARY KEY(`id`),
  CONSTRAINT `materias_primas_fabricas_mp_fabrica_unique` UNIQUE(`materia_prima_id`,`fabrica_id`),
  CONSTRAINT `materias_primas_fabricas_materia_prima_id_materias_primas_id_fk` FOREIGN KEY (`materia_prima_id`) REFERENCES `materias_primas`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `materias_primas_fabricas_fabrica_id_fabricas_id_fk` FOREIGN KEY (`fabrica_id`) REFERENCES `fabricas`(`id`) ON DELETE no action ON UPDATE no action
);
