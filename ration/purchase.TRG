TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`localhost` TRIGGER `update_schedule` AFTER INSERT ON `purchase` FOR EACH ROW BEGIN \nUPDATE schedule set status=\'issued\' where schedule.card_no=NEW.card_no;\nEND'
sql_modes=1098907648
definers='root@localhost'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_unicode_ci'
db_cl_names='utf8mb4_general_ci'
created=157475889608
