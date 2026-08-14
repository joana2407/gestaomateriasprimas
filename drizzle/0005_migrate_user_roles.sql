ALTER TABLE `users`
  MODIFY COLUMN `role` enum('user','admin','logistica','qualidade') NOT NULL DEFAULT 'logistica';

UPDATE `users`
  SET `role` = 'qualidade'
  WHERE `role` IN ('user', 'admin');

ALTER TABLE `users`
  MODIFY COLUMN `role` enum('logistica','qualidade') NOT NULL DEFAULT 'logistica';
