ALTER TABLE `users`
  MODIFY COLUMN `role` enum('logistica','qualidade','gestao') NOT NULL DEFAULT 'logistica';
