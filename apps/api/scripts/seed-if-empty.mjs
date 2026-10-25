// Nạp dữ liệu mẫu CHỈ khi bảng Product đang rỗng (dùng cho lần deploy đầu tiên).
// Không bao giờ xóa dữ liệu đang có: nếu đã có sản phẩm thì thoát ngay.
// Bật bằng biến môi trường SEED_IF_EMPTY=true (xem apps/api/Dockerfile).
import { spawnSync } from 'node:child_process';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM "Product"');
await client.end();

if (rows[0].n > 0) {
  console.log(`[seed-if-empty] Đã có ${rows[0].n} sản phẩm, bỏ qua seed.`);
  process.exit(0);
}

console.log('[seed-if-empty] CSDL rỗng, chạy seed...');
const r = spawnSync('npx', ['prisma', 'db', 'seed', '--config', 'prisma7.config.ts'], {
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
