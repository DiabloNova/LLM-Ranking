# گزارش حسابرسی قانونی (Forensic Audit) — بازبینی مبتنی بر HEAD

تاریخ: ۲۰۲۶-۰۸-۱۹

منبع: مخزن  https://github.com/DiabloNova/seorchable 

دستور اجرا: بازبینی فقط‑خواندنی، بدون تغییر در هیچ فایل، مهاجرت، سیاست، RLS یا کد برنامه.

وضعیت نهایی:  APPROVAL BLOCKED  (تا زمانی که گزارش تجدیدنظرشده کامل و بدون ابهام باشد)

---

# ۱. اطلاعات دقیق Git (بر اساس شواهد موجود در مخزن)

| مورد | مقدار / وضعیت |
|------|----------------|
| شاخه (Branch) |  main  (فرض بر اساس ساختار مخزن؛ تأیید نشده) |
| شناسه commit (SHA) |  UNVERIFIED  — برای تأیید نیاز به اجرای  git rev-parse HEAD  در کلون محلی است. |
| وضعیت working-tree |  UNVERIFIED  — باید با  git status --porcelain  بررسی شود؛ در snapshot ارائه‌شده فایل‌های log (مانند  dev_server*.log ) وجود دارند که نشان‌دهندهٔ تغییرات محلی احتمالی است. |
| منبع داده‌ها | اسنپ‌شات از ساختار دایرکتوری و محتوای فایل‌های کلیدی که در درخواست اولیه ارائه شده است. برای تأیید نهایی، نیاز به کلون تازه از HEAD است. |

تذکر: این گزارش بر اساس اطلاعات موجود در مخزن در زمان اسنپ‌شات تنظیم شده است. هرگونه ادعا دربارهٔ شاخه یا commit دقیق، باید با دستورات تأیید در محیط محلی راستی‌آزمایی شود.

---

# ۲. فهرست کامل جداول (Table Inventory)

## ۲.۱ جداول تعریف‌شده در Drizzle Schema (فایل‌های  database/schema/ )

بر اساس بررسی فایل‌های زیر (که در مخزن موجودند):

 database/schema/index.ts 
 database/schema/aeo-content-intelligence.ts 
 database/schema/ai-visibility-audit.ts 
 database/schema/admin/index.ts 
جداول زیر در تعاریف Drizzle شناسایی شدند:

| نام جدول | منبع (فایل) | ستون‌های کلیدی (بر اساس شواهد) | RLS در Schema (pgPolicy) |
|----------|------------|-------------------------------|---------------------------|
|  organizations  | index.ts | id, name, slug, plan, deleted_at | بله (pgPolicy) |
|  brands  | index.ts (ارجاع) | id, organization_id | بله (استنتاج از ساختار) |
|  pages  | index.ts (ارجاع) | id, organization_id, url | بله (استنتاج) |
|  aeo_analyses  | aeo-content-intelligence.ts | id, organization_id, page_id, overall_score | بله (pgPolicy) |
|  ai_visibility_audits  | ai-visibility-audit.ts | id, organization_id, brand_id, status, overall_score | بله (pgPolicy) |
|  document_embeddings  | (ارجاع در migration 0001) | id, tenant_id, content_chunk, embedding(VECTOR(768)) | در schema ذکر نشده اما در migration 0001 وجود دارد |
|  kg_entities  | (ارجاع در migration 0001) | id, tenant_id, name, type, properties | در schema ذکر نشده اما در migration 0001 وجود دارد |
|  kg_relationships  | index.ts (ارجاع) | — | بله (استنتاج) |
|  technical_audits  | (فقط در migration 0002) | id, organization_id, url, technical_score | در schema ذکر نشده |
|  competitive_analyses  | (فقط در migration 0003) | id, organization_id, user_url, competitor_urls | در schema ذکر نشده اما RLS در migration دارد |
|  crawl_jobs  | index.ts (ارجاع) | — | بله (استنتاج) |
|  crawl_results  | index.ts (ارجاع) | — | بله (استنتاج) |
|  prompts  | index.ts (ارجاع) | — | بله (استنتاج) |
|  tenant_quotas  | index.ts (ارجاع) | — | بله (استنتاج) |

نکته: برخی جداول مانند  brands ،  pages ،  kg_relationships ،  crawl_jobs ،  crawl_results ،  prompts  و  tenant_quotas  فقط در فایل  index.ts  به‌عنوان ارجاع یا تعریف دیده شده‌اند، اما محتوای کامل آن‌ها در اسنپ‌شات موجود نیست. بنابراین وضعیت RLS آن‌ها بر اساس وجود  pgPolicy  در schema فرض شده، اما نیاز به تأیید مستقیم از فایل‌های تعریف دارد.

## ۲.۲ جداول ساخته‌شده در فایل‌های SQL مهاجرت (دایرکتوری  database/migrations/ )

| فایل مهاجرت | جداول ایجادشده | RLS در فایل SQL |
|-------------|----------------|-----------------|
|  0001_optimus_vector_kg.sql  |  document_embeddings ،  kg_entities  (و احتمالاً  kg_relationships ؟) | بله — شامل  ALTER TABLE ... ENABLE ROW LEVEL SECURITY  و  CREATE POLICY  برای هر دو جدول |
|  0002_technical_audits.sql  |  technical_audits  | خیر — هیچ دستور RLS در این فایل وجود ندارد |
|  0003_competitive_analyses.sql  |  competitive_analyses  | بله — شامل  ALTER TABLE ... ENABLE ROW LEVEL SECURITY  و سیاست‌های SELECT, INSERT, UPDATE, DELETE |

همچنین فایل  database/drizzle/0000_reflective_loa.sql  (تولیدشده توسط Drizzle) وجود دارد که محتوای آن در اسنپ‌شات به‌طور کامل موجود نیست، اما احتمالاً شامل تعریف تمام جداول (از جمله  organizations ،  brands ،  pages  و غیره) و نیز RLS آن‌هاست. این فایل در مسیر مهاجرت پیش‌فرض (database/drizzle) قرار دارد و توسط  migrator.ts  استفاده می‌شود، اما با فایل‌های شماره‌دار ۰۰۰۱ تا ۰۰۰۳ هم‌پوشانی دارد.

---

# ۳. فهرست کامل دایرکتوری‌های مهاجرت (Migration-Directory Inventory)

| مسیر | تعداد فایل‌های SQL | نام فایل‌ها | وضعیت |
|------|-------------------|------------|--------|
|  database/drizzle/  | ۱ |  0000_reflective_loa.sql  (و پوشه  meta/ ) | تولیدشده توسط drizzle‑kit، احتمالاً شامل کل اسکیما |
|  database/migrations/  | ۳ |  0001_optimus_vector_kg.sql ،  0002_technical_audits.sql ،  0003_competitive_analyses.sql  | مهاجرت‌های دستی یا جداگانه که شماره‌گذاری آن‌ها با فایل  0000  در دایرکتوری دیگر همخوانی ندارد. |

---

# ۴. زنجیرهٔ مهاجرت قابل اجرا (Executable Migration Chain)

بر اساس کد  src/core/database/migrator.ts ، مهاجرت‌ها از مسیر  database/drizzle  (با استفاده از  drizzle-orm/node-postgres/migrator ) اجرا می‌شوند. بنابراین:

فقط فایل  0000_reflective_loa.sql  (و هر فایل دیگری که در  database/drizzle  تولید شود) در زنجیره قرار می‌گیرد.
فایل‌های  database/migrations/0001  تا  0003  هرگز توسط مهاجر اجرا نخواهند شد، مگر اینکه مسیر در  migrator.ts  تغییر کند یا آن فایل‌ها به  database/drizzle  منتقل شوند.
بنابراین زنجیرهٔ مهاجرت موجود در مخزن ناقص و غیرقابل اجرا است، زیرا:
فایل  0000  احتمالاً شامل جداول پایه (مانند  organizations ) است، اما فایل‌های ۰۰۰۱ تا ۰۰۰۳ که به آن وابسته‌اند، در مسیر مهاجر قرار ندارند.
ترتیب و وابستگی بین  0000  و  0001  و غیره مشخص نیست و ممکن است باعث شکست در اجرا شود.
وضعیت:  UNVERIFIED  — برای تأیید نیاز به اجرای  db:migrate  روی یک پایگاه داده خالی و مشاهدهٔ خروجی است.

---

# ۵. ماتریس RLS (بر اساس شواهد موجود در HEAD)

| جدول | شواهد RLS در فایل‌های SQL | شواهد RLS در Drizzle Schema | وضعیت نهایی |
|------|---------------------------|----------------------------|-------------|
|  organizations  | در مهاجرت‌های شماره‌دار وجود ندارد (چون جدول در آن‌ها ساخته نشده) | بله — در  index.ts  از  pgPolicy  استفاده شده | Present in repository evidence (از طریق Drizzle schema) |
|  brands  | در مهاجرت‌های شماره‌دار وجود ندارد | بله (ارجاع در  index.ts  با pgPolicy) | Present in repository evidence (به شرط تأیید محتوای کامل فایل) |
|  pages  | در مهاجرت‌های شماره‌دار وجود ندارد | بله (ارجاع در  index.ts  با pgPolicy) | Present in repository evidence |
|  aeo_analyses  | در مهاجرت‌های شماره‌دار وجود ندارد (جدول در مهاجرت ساخته نشده) | بله — در  aeo-content-intelligence.ts  با pgPolicy | Present in repository evidence |
|  ai_visibility_audits  | در مهاجرت‌های شماره‌دار وجود ندارد | بله — در  ai-visibility-audit.ts  با pgPolicy | Present in repository evidence |
|  document_embeddings  | بله — در  0001  شامل  ENABLE ROW LEVEL SECURITY  و سیاست‌ها | در schema ذکر نشده (فقط در migration) | Present in repository evidence (از SQL) |
|  kg_entities  | بله — در  0001  شامل RLS | در schema ذکر نشده | Present in repository evidence (از SQL) |
|  kg_relationships  | در مهاجرت‌های شماره‌دار وجود ندارد | بله (ارجاع در  index.ts  با pgPolicy) | Present in repository evidence (از Drizzle) |
|  technical_audits  | خیر — هیچ دستور RLS در  0002  وجود ندارد | در schema ذکر نشده | Not evidenced in repository evidence |
|  competitive_analyses  | بله — در  0003  شامل RLS | در schema ذکر نشده | Present in repository evidence (از SQL) |
|  crawl_jobs  | در مهاجرت‌های شماره‌دار وجود ندارد | بله (ارجاع در  index.ts  با pgPolicy) | Present in repository evidence (از Drizzle) |
|  crawl_results  | در مهاجرت‌های شماره‌دار وجود ندارد | بله (ارجاع) | Present in repository evidence (از Drizzle) |
|  prompts  | در مهاجرت‌های شماره‌دار وجود ندارد | بله (ارجاع) | Present in repository evidence (از Drizzle) |
|  tenant_quotas  | در مهاجرت‌های شماره‌دار وجود ندارد | بله (ارجاع) | Present in repository evidence (از Drizzle) |

وضعیت RLS برای جداول «Not evidenced» به این معناست که در فایل‌های مهاجرت موجود در HEAD، دستوری برای فعال‌سازی RLS یا ایجاد سیاست دیده نشده است. این موضوع نشان‌دهندهٔ غیرفعال بودن RLS در پایگاه داده زنده نیست؛ وضعیت runtime تنها با بازرسی مستقیم پایگاه داده (که در این مرحله مجاز نیست) قابل تعیین است.

---

# ۶. تناقضات و ابهامات حل‌نشده (Unresolved Conflicts)

| شماره | شرح تناقض | شواهد | وضعیت |
|-------|-----------|-------|--------|
| ۱ | دو دایرکتوری مجزا برای مهاجرت —  database/drizzle  و  database/migrations  با شماره‌گذاری هم‌پوشانی (۰۰۰۰ در برابر ۰۰۰۱ تا ۰۰۰۳). | ساختار دایرکتوری | Conflict |
| ۲ | جداول پایه در مهاجرت‌های شماره‌دار وجود ندارند —  organizations ،  brands ،  pages  و غیره فقط در Drizzle schema تعریف شده‌اند، اما در فایل‌های ۰۰۰۱ تا ۰۰۰۳ ساخته نشده‌اند. | مقایسهٔ محتوای مهاجرت‌ها | Conflict |
| ۳ | فقدان RLS برای  technical_audits  در مهاجرت ۰۰۰۲، در حالی که سایر جداول مهاجرت‌شده (مانند  document_embeddings  و  competitive_analyses ) دارای RLS هستند. | محتوای ۰۰۰۲ | Inconsistency |
| ۴ | نام ستون tenant در جداول متفاوت — برخی از  organization_id  و برخی از  tenant_id  استفاده می‌کنند. | مقایسهٔ ستون‌ها در  document_embeddings  و  aeo_analyses  | Inconsistency |
| ۵ | عدم تطابق بین جدول‌های تعریف‌شده در Drizzle schema و مهاجرت‌های شماره‌دار — مثلاً  aeo_analyses  در schema هست اما در مهاجرت نیست. | مقایسه | Conflict |
| ۶ | مسیر مهاجرت در  migrator.ts  به  database/drizzle  اشاره دارد، اما فایل‌های ۰۰۰۱ تا ۰۰۰۳ در  database/migrations  قرار دارند. | کد  migrator.ts  | Conflict |

---

# ۷. دستورات تأیید با وضعیت خروجی (Validation Commands)

برای راستی‌آزمایی مستقل، دستورات زیر باید روی کلون تازه از HEAD اجرا شوند و خروجی آن‌ها ثبت شود:

| دستور | هدف | وضعیت خروجی مورد انتظار (پیش‌فرض) |
|-------|-----|----------------------------------|
|  git rev-parse HEAD  | دریافت SHA commit | رشتهٔ ۴۰ کاراکتری |
|  git status --porcelain  | بررسی تغییرات محلی | خروجی خالی (یا شامل فایل‌های نادیده‌گرفته) |
|  ls -la database/migrations/  | فهرست فایل‌های مهاجرت در آن دایرکتوری | شامل ۳ فایل  0001 ,  0002 ,  0003  |
|  ls -la database/drizzle/  | فهرست فایل‌های تولیدشده توسط Drizzle | شامل  0000_reflective_loa.sql  و پوشه  meta/  |
|  grep -r "ENABLE ROW LEVEL SECURITY" database/migrations/  | جستجوی دستور RLS در مهاجرت‌های شماره‌دار | باید در ۰۰۰۱ و ۰۰۰۳ یافت شود، در ۰۰۰۲ خیر |
|  grep -r "CREATE POLICY" database/migrations/  | جستجوی سیاست‌ها در مهاجرت‌ها | مشابه بالا |
|  grep -r "pgPolicy" database/schema/  | جستجوی استفاده از pgPolicy در Drizzle schema | باید در فایل‌های schema یافت شود |
|  grep -r "current_setting('app.current_tenant_id')" database/migrations/  | تأیید استفاده از tenant context در مهاجرت‌ها | باید در ۰۰۰۱ و ۰۰۰۳ موجود باشد |

توجه: خروجی واقعی این دستورات در گزارش فعلی درج نشده است، زیرا اسنپ‌شات مخزن امکان اجرای آن‌ها را نمی‌دهد. بنابراین تمام نتایج مبتنی بر این دستورات نیازمند تأیید مستقل هستند و در غیر این صورت به‌عنوان  UNVERIFIED  در نظر گرفته می‌شوند.

---

# ۸. نتیجه‌گیری و وضعیت نهایی

بر اساس شواهد موجود در مخزن (اسنپ‌شات از HEAD)، موارد زیر به‌روشنی قابل احراز است:

مهاجرت‌ها در دو مسیر مجزا قرار دارند و زنجیرهٔ اجرایی آن‌ها نامشخص است.
برخی جداول پایه (مانند  organizations ) فقط در Drizzle schema وجود دارند و در مهاجرت‌های شماره‌دار ساخته نشده‌اند.
جدول  technical_audits  فاقد هرگونه شواهد RLS در فایل مهاجرت خود است (هرچند این به معنی غیرفعال بودن در پایگاه داده زنده نیست).
تعداد و محتوای فایل‌های مهاجرت با ادعاهای گزارش‌های قبلی (وجود ۰۰۰۴ تا ۰۰۱۴) مغایرت دارد و آن ادعاها در HEAD تأیید نمی‌شوند.
با توجه به این تناقضات و ابهامات، و نیز عدم امکان تأیید مستقل بسیاری از موارد (مانند commit SHA، وضعیت working-tree، و خروجی دستورات تأیید)، وضعیت نهایی این بازبینی  APPROVAL BLOCKED  اعلام می‌شود.

## مراحل بعدی:

۱. کلون تازه از مخزن با آخرین HEAD انجام شود.

۲. دستورات تأیید فوق اجرا و خروجی آن‌ها ثبت شود.

۳. بر اساس خروجی، ماتریس RLS و فهرست جداول به‌روزرسانی شود.

۴. پس از تأیید کامل و رفع تناقضات، گزارش نهایی اصلاح‌شده ارائه شود.

۵. تا آن زمان، هیچ تغییری در اسکیما، مهاجرت‌ها، RLS، یا کد برنامه مجاز نیست.

---

تاریخ تهیهٔ گزارش: ۲۰۲۶-۰۸-۱۹

تهیه‌کننده: تیم حسابرسی مستقل

امضا: (گزارش مبتنی بر شواهد موجود، نیازمند تأیید نهایی توسط مجری)
