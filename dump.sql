ALTER TABLE Schedule AUTO_INCREMENT = 1;
ALTER TABLE User AUTO_INCREMENT = 1;

-- 어드민 계정 생성 (개발부, 최고 관리자)
INSERT INTO User (name, position, department, email, phone_number, password, is_admin, is_approved)
VALUES ('관리자', '최고 관리자', '개발부', 'admin@example.com', '010-1234-5678', 'admin_password', TRUE, TRUE);

-- 일반 사용자 계정 9개 생성 (개발부, 주임/대리)
INSERT INTO User (name, position, department, email, phone_number, password)
VALUES
    ('김철수', '주임', '개발부', 'kim@example.com', '010-9876-5432', 'password01'),
    ('이영희', '대리', '개발부', 'lee@example.com', '010-1111-2222', 'password02'),
    ('박지성', '주임', '개발부', 'park@example.com', '010-3333-4444', 'password03'),
    ('최미나', '대리', '개발부', 'choi@example.com', '010-5555-6666', 'password04'),
    ('정현우', '주임', '개발부', 'jung@example.com', '010-7777-8888', 'password05'),
    ('강수진', '대리', '개발부', 'kang@example.com', '010-9999-0000', 'password06'),
    ('윤도현', '주임', '개발부', 'yoon@example.com', '010-1212-3434', 'password07'),
    ('서지혜', '대리', '개발부', 'seo@example.com', '010-5656-7878', 'password08'),
    ('한성진', '주임', '개발부', 'han@example.com', '010-9090-1010', 'password09');


-- Schedule 테이블 더미 데이터 (80% 출근, 15개, 시작 <= 종료 날짜 보장)
INSERT INTO Schedule (user_id, start_date, end_date, task, status) VALUES
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '정상 출근', '준비중'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '오전 회의 참석', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '오후 개발 업무', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '프로젝트 진행', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '팀 협업', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '개인 학습', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '코드 검토', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '기획 회의 준비', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '버그 수정', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '배포 준비', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), 'Tech Review', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '업무 정리', '출근'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '거래처 미팅', '파견'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '가족 행사', '휴가'),
    (FLOOR(RAND() * 10) + 1, @start_date := DATE_ADD('2025-01-24', INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(@start_date, INTERVAL FLOOR(RAND() * 7) DAY), '몸살 증상', '병가');



