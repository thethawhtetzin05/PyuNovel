CREATE INDEX `chapter_novel_status_published_sort_idx` ON `chapters` (`novel_id`,`status`,`published_at`,`sort_index`);
