
#  مرحله صفر: تثبیت شواهد و snapshot

## پرسش جولز:
هدف: فقط بررسی read-only مخزن و ثبت baseline. هیچ فایل، پایگاه داده، migration، schema، RLS یا کد برنامه را تغییر نده.

مخزن:
https://github.com/DiabloNova/seorchable

فرآیند:
1. مخزن را تازه clone کن.
2. شاخه و commit دقیق را با این دستورات ثبت کن:
   
`git branch --show-current
git rev-parse HEAD
git status --porcelain`
   
3. فهرست کامل این مسیرها را ثبت کن:
   
   `database/drizzle/
   database/drizzle/meta/
   database/migrations/`
   
   4. محتوای package.json، src/core/database/migrator.ts و فایل‌های schema را بررسی کن.
   5. بررسی کن آیا database/drizzle مسیر اجرایی migration است و آیا database/migrations مسیر رقیب است.
   6. هیچ DATABASE_URL متصل به Neon فعلی را استفاده نکن.
   7. اگر snapshot یا branch جداگانه برای پایگاه داده وجود ندارد، کار را متوقف کن و فقط دستورالعمل ساخت Neon branch جداگانه را گزارش کن.

## خروجی الزامی:
- commit SHA
- branch
- working-tree status
- فهرست کامل فایل‌ها
- مسیر `canonical` فعلی `migration`
- مسیر `legacy` یا رقیب
- وابستگی‌های `Drizzle`
- ریسک‌های کشف‌ شده
- فایل‌های تغییر کرده: none
- تست‌ها: none
- وضعیت: `BASELINE VERIFIED` یا `BLOCKED`

# مرحله اول: تطبیق کامل schema و migration

## پرسش جولز:
هدف: تولید inventory دقیق و read-only از جدول‌ها. هیچ فایل یا پایگاه دادهی را تغییر نده.

محدوده بررسی:
- database/schema/
- database/drizzle/0000_reflective_loa.sql
- database/migrations/*.sql
- src/core/database/migrator.ts

کارها:
1. همه `table definition` های `TypeScript` را استخراج کن.
2. همه `CREATE TABLE` های database/drizzle را استخراج کن.
3. همه `CREATE TABLE` های database/migrations را استخراج کن.
4. نام جدول‌ها را `canonicalize` کن و `duplicate` ها را حذف نکن؛ منبع هر `occurrence` را نگه دار.
5. برای هر جدول این ستون‌ها را گزارش کن:
   
`table_name, TypeScript source, Drizzle SQL source, legacy SQL source, canonical status`

6. اختلاف countهای 32، 36، 52، 53 و 57 را دقیقاً reconcile کن.
7.  جدول‌هایی را که در schema هستند ولی در migration نیستند مشخص کن.
8.   جدول‌هایی را که در migration هستند ولی در schema نیستند مشخص کن
9. اختلاف type، nullability، default، FK، enum/check constraint و tenant column را ثبت کن.

خروجی:
- inventory کامل table-by-table
- count  confirmed 
- اختلاف‌های unresolved
- بدون تغییر فایل
- وضعیت: VERIFIED یا BLOCKED

# مرحله دوم: تعیین یک migration chain رسمی

# پرسش جولز:
هدف: طراحی و اجرای تصمیم migration بدون تغییر کد در این مرحله.

شواهد موجود:
- فایل src/core/database/migrator.ts از database/drizzle استفاده می‌کند.
- همچنین database/drizzle شامل 0000_reflective_loa.sql و meta است.
- و database/migrations شامل فایل‌های 0001 تا 0014 است.

کارها:
1. بررسی کن آیا 0000 تمام جدول‌ها و constraint های لازم را ایجاد می‌کند.
2. بررسی کن آیا فایل‌های 0001 تا 0014 با 0000 duplicate یا conflicting هستند.
3. مسیر canonical پیشنهادی را database/drizzle در نظر بگیر، اما بدون تأیید حذف یا جابه‌جایی انجام نده.
4. برای database/migrations یک وضعیت دقیق تعیین کن:
   - جستجوی legacy قابل حذف
   - منبع ناقص
   - منبع لازم برای ادغام
   - مسیر مستقل اما غیرقابل اجرا
5. یک migration policy کوتاه در docs ایجاد نکن؛ فقط draft محتوای پیشنهادی را در گزارش ارائه کن.
6. هیچ یک از مقادیر migrationا را rename، delete، move یا merge نکن.

خروجی:
- تصمیم پیشنهادی canonical path
- دلیل فنی
- فهرست duplicate/conflict
- برنامه کم‌ریسک برای یکپارچه‌سازی
- تغییرات فایل: none

# مرحله سوم: اصلاح canonical Drizzle schema

## پرسش جولز:
هدف: یکپارچه‌سازی schema TypeScript با migration canonical Drizzle، فقط در شاخه مستقل.

قبل از شروع:
- فقط از commit baseline تأییدشده استفاده کن.
- به Neon فعلی یا هر پایگاه داده دارای داده وصل نشو.
- اگر `DATABASE_URL` به پایگاه داده غیر از `disposable` اشاره دارد، متوقف شو.

فایل‌های مجاز:
- database/schema/index.ts
- database/schema/*.ts
- drizzle.config.* در صورت وجود
- package.json فقط برای dependency ضروری
- package-lock.json یا lockfile متناظر

کارها:
1. ابتدا schema واقعی را بر اساس table inventory مرحله قبل canonical کن.
2. همه جدول‌های موردنیاز را در یک schema Drizzle معتبر تعریف کن.
3. و FK ها، index ها، default ها، enum/check constraint ها و tenant column ها را یکسان کن.
4. و اینکه tenant column را برای هر جدول صریحاً مشخص کن:
   آیا  organization_id یا tenant_id، بدون حدس.
5. از تغییر رفتار application repositories خودداری کن.
6.و migration را با db:generate تولید کن.
7- و diff تولید شده را بررسی کن و از migration مخرب جلوگیری کن.

خروجی:
- فایل‌های تغییر یافته
- diff خلاصه
- migration تولیدشده
- dependency changes
- دستورهای اجراشده و exit code
- ریسک compatibility
- وضعیت: READY FOR REVIEW یا BLOCKED

# مرحله چهارم: migration روی PostgreSQL خالی


## پرسش جولز:
هدف: اثبات اجرای migration از صفر روی پایگاه داده موقت و خالی.

محدوده:
- فقط database/drizzle/
- و src/core/database/migrator.ts
-  و package scripts در صورت نیاز برای اجرای تست

قوانین ایمنی:
1. هرگز به Neon فعلی، production یا پایگاه داده دارای داده وصل نشو.
2.و  target باید PostgreSQL disposable باشد، مثل container یا Neon branch تازه.
3. قبل از migration این queryها را اجرا و خروجی ثبت کن:
 `SELECT current_database(), current_user, version();
   SELECT count(*) FROM pg_class WHERE relkind IN ('r','p');
   SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema');`
   
5. اگر هر جدول application از قبل وجود داشت، متوقف شو.
6. یا migration را با npm run db:migrate اجرا کن.
7. و یا migration tracking table و مقدار ثبت‌ شده را گزارش کن.
8. فهرست همه جدول‌ها، FK ها، index ها، enum ها و constraint ها را استخراج کن.
9. اجرای دوم migration را نیز انجام بده و idempotency را ثبت کن.

خروجی الزامی:
- نوع دقیق target
- و proof خالی بودن پایگاه داده
- و command و exit status
- و complete migration output
- و migration tracking result
- و table inventory
- و FK validation
- و second-run result
- و unresolved risks

# مرحله پنجم: اثبات RLS و FORCE RLS در پایگاه داده


## پرسش جولز:
هدف: اثبات runtime بودن RLS، نه صرفاً وجود pgPolicy در TypeScript.

پیش‌نیاز:
- فقط همان PostgreSQL disposable مرحله قبل.
- اگر migration مرحله قبل موفق نشده، متوقف شو.

کارها:
1. برای همه جدول‌های tenant-scoped این queryها را اجرا کن:
   `SELECT schemaname, tablename, rowsecurity, forcerowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;`
   
3.و  سیاست ها را با این اطلاعات استخراج کن:
   `policy name, table, command, roles, permissive, USING, WITH CHECK`
4. بررسی کن policy های SELECT/INSERT/UPDATE/DELETE واقعاً در پایگاه داده ایجاد شده‌اند.
5. بررسی کن FORCE ROW LEVEL SECURITY برای هر جدول فعال است یا خیر.
6. با دو tenant آزمایشی تست کن:
   -با  tenant A نباید ردیف tenant B را SELECT کند.
   - با INSERT با tenant اشتباه باید fail شود.
   - و UPDATE و DELETE cross-tenant باید صفر ردیف یا خطای policy بدهد.
7. تست را با role application و role owner جداگانه انجام بده.
8. اگر FORCE RLS در schema وجود ندارد، آن را اضافه نکن؛ فقط گزارش کن.

خروجی:
- جدول کامل RLS state
- همچنین policy های کامل
- و یا USING/WITH CHECK دقیق
- و role های تست‌ شده
- خروجی تست isolation
- وضعیت FORCE RLS
- و failureهای امنیتی

# مرحله ششم: اصلاح db:push و مرز production

## پرسش جولز:
هدف: جلوگیری از اجرای تصادفی db:push روی production یا پایگاه داده غیرخالی.

فایل‌های مجاز:
-اول package.json
- و drizzle.config.* در صورت وجود
- یک `guard script` جدید در scripts/database/ در صورت نیاز
- مستندات کوتاه اجرای database

کارها:
1. بررسی کن db:push فعلی چگونه اجرا می‌شود.
2. guard بساز که این موارد را رد کند:
   - NODE_ENV=production
   - DATABASE_URL دارای production marker
   - پایگاه داده دارای جدول application
   - نبودن صریح ALLOW_DB_PUSH=true
3. guard نباید secret را log کند.
4. db:migrate را برای deployment canonical نگه دار.
5. db:push فقط برای development disposable مجاز باشد.
6. تست‌های مثبت و منفی برای guard اضافه کن.
7. هیچ migration یا schema را در این مرحله تغییر نده.

مثال رفتار مورد انتظار:
- production => exit 1
- پایگاه داده غیرخالی => exit 1
- development + پایگاه داده خالی + ALLOW_DB_PUSH=true => مجاز
- اجرای عادی بدون flag => exit 1

خروجی:
- diff دقیق
- commandهای تست
- exit code همه تست‌ها
- توضیح امنیتی

# مرحله هفتم: اصلاح tenant context و pool behavior

## پرسش جولز:
هدف: اصلاح فقط رفتار tenant context و connection handling، بدون refactor unrelated.

فایل‌های مجاز:
- src/core/database/tenant-context/index.ts
- src/features/admin/infrastructure/persistence/postgres/index.ts
- تست‌های مستقیم همین دو ماژول

قوانین:
1. ابتدا diff نسبت به commit baseline را ثبت کن.
2. هر تغییر باید با یک مشکل مشخص در گزارش audit مرتبط باشد.
3. fallback in-memory یا MockPoolClient نباید در production مسیر موفق تلقی شود.
4. tenant-scoped query باید بدون active tenant transaction رد شود.
5. set_config('app.current_tenant_id', ..., true) باید transaction-local بماند.
6. leased client باید در تمام مسیرهای success و failure آزاد شود.
7. nested context و savepoint behavior را حفظ یا با تست اثبات کن.
8. system context نباید به‌صورت implicit ایجاد شود.
9. هیچ جدول جدیدی تعریف نکن.
10. هیچ policy یا migration جدیدی تولید نکن.

تست‌های الزامی:
- missing tenant context
- wrong tenant context
- transaction rollback
- client release
- nested savepoint
- no session-variable leakage
- offline fallback در production باید fail closed باشد

خروجی:
- diff کامل هر دو فایل
- دلیل هر تغییر
- compatibility analysis
- تست‌ها و exit code
- unresolved risks

# مرحله هشتم: حذف mock data و اتصال واقعی repositoryها


## پرسش جولز:
هدف: حذف تدریجی mock/random data فقط از مسیرهایی که schema و database آن‌ها در مراحل قبل اثبات شده است.

قبل از شروع:
- فهرست جدول‌های verified را از گزارش قبلی بخوان.
- برای جدول یا repository تأییدنشده هیچ تغییری نده.

فایل‌های مجاز:
- فقط route/service/repositoryهایی که در گزارش mock-data inventory آمده‌اند.
- تست متناظر هر فایل.
- از تغییر schema و migration خودداری کن.

کارها:
1. هر Math.random، hardcoded response یا in-memory fallback را دسته‌بندی کن.
2. برای هر مورد مشخص کن:
   database-backed، intentionally static، یا هنوز blocked.
3. فقط database-backed موارد verified را به repository واقعی متصل کن.
4. static documentation data را حذف نکن.
5. fallbackهای ناامن را به fail-closed یا error response تبدیل کن.
6. authorization و tenant context را در route حفظ کن.

برای هر اصلاح، گزارش کن:
- route
- source قبلی
- repository جدید
- table
- tenant boundary
- error behavior
- تست

اگر dependency یا schema نامشخص است، حدس نزن و آن مورد را BLOCKED گزارش کن.

# مرحله نهم: اجرای کامل quality gate


## پرسش جولز:
هدف: اجرای quality gate کامل و ثبت شواهد، بدون تغییر کد مگر رفع خطای مستقیم همین مرحله.

دستورات را دقیقاً اجرا کن:
1. npm install یا package-manager معادل lockfile
2. npx tsc --noEmit
3. npm run lint
4. npm test، اگر script وجود دارد
5. npm run test:acquisition
6. تست‌های tenant isolation
7. npm run db:generate -- --check، اگر پشتیبانی می‌شود
8. npm run db:migrate روی PostgreSQL disposable خالی
9. اجرای دوباره migration
10. pre-commit hook، اگر وجود دارد

برای هر دستور ثبت کن:
- command کامل
- شروع و پایان
- exit status
- stdout/stderr خلاصه
- failure root cause
- آیا failure مربوط به baseline است یا تغییرات remediation

هیچ نتیجه‌ای را با عبارت «passed» گزارش نکن مگر exit status و output وجود داشته باشد.

# مرحله دهم: گزارش نهایی برای ناظر


## پرسش جولز:
هدف: تولید reconciliation report نهایی، بدون هیچ تغییر جدید.

گزارش باید دقیقاً به هشت اعتراض ناظر پاسخ دهد:
1. before/after RLS table diff
2. reconcile همه table counts
3. inventory کامل migration directories
4. اجرای migration روی پایگاه داده خالی
5. policy و FORCE RLS runtime evidence
6. db:push production guard
7. diff کامل دو فایل tenant/persistence
8. command و exit status همه quality checks

قواعد:
- هر ادعا باید source file، commit SHA، command output یا database query output داشته باشد.
- موارد اثبات‌نشده را UNVERIFIED بنویس.
- موارد ناموفق را FAILED بنویس.
- از واژه‌های preserved، complete، passed یا approved بدون evidence استفاده نکن.
- unresolved risks را جداگانه و شماره‌گذاری‌شده بیاور.
- نتیجه نهایی فقط یکی از این موارد باشد:
  APPROVAL READY
  APPROVAL BLOCKED
  REMEDIATION FAILED

فهرست فایل‌های تغییرکرده، commitها، branchها، تست‌ها و database target را در ابتدای گزارش بیاور.


ترتیب درست این است: ۰ تا ۲ فقط شواهد، ۳ تا ۸ اصلاح محدود، ۹ اثبات، ۱۰ گزارش. اگر Jules در هر مرحله به پایگاه داده اصلی Neon، migration مبهم یا dependency ناشناخته برخورد کرد، دستور صریح این است: توقف، حدس نزدن، و گزارش BLOCKED.
