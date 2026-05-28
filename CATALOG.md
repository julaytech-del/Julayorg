# Julay.org — كتالوج المنصة الشامل

> **julay.org** — منصة إدارة مشاريع مدعومة بالذكاء الاصطناعي (Claude AI)  
> بديل لـ Monday.com وAsana مع ميزات AI أولى.

---

## جدول المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [المكدس التقني (Tech Stack)](#2-المكدس-التقني-tech-stack)
3. [هيكل المشروع](#3-هيكل-المشروع)
4. [خرائط الصفحات والمسارات](#4-خرائط-الصفحات-والمسارات)
5. [الخصائص التفصيلية](#5-الخصائص-التفصيلية)
   - [5.1 الصفحة الرئيسية (Landing)](#51-الصفحة-الرئيسية-landing)
   - [5.2 المصادقة (Auth)](#52-المصادقة-auth)
   - [5.3 لوحة التحكم (Dashboard)](#53-لوحة-التحكم-dashboard)
   - [5.4 المشاريع (Projects)](#54-المشاريع-projects)
   - [5.5 المهام (Tasks)](#55-المهام-tasks)
   - [5.6 لوحة Kanban](#56-لوحة-kanban)
   - [5.7 Gantt / Timeline](#57-gantt--timeline)
   - [5.8 Sprint Board](#58-sprint-board)
   - [5.9 الذكاء الاصطناعي AI Studio](#59-الذكاء-الاصطناعي-ai-studio)
   - [5.10 التقويم (Calendar)](#510-التقويم-calendar)
   - [5.11 توزيع العمل (Workload)](#511-توزيع-العمل-workload)
   - [5.12 تتبع الوقت (Time Tracking)](#512-تتبع-الوقت-time-tracking)
   - [5.13 التقارير (Reports)](#513-التقارير-reports)
   - [5.14 الأتمتة (Automations)](#514-الأتمتة-automations)
   - [5.15 الفريق (Team)](#515-الفريق-team)
   - [5.16 الأقسام (Departments)](#516-الأقسام-departments)
   - [5.17 محفظة المشاريع (Portfolio)](#517-محفظة-المشاريع-portfolio)
   - [5.18 سجل النشاط (Activity Log)](#518-سجل-النشاط-activity-log)
   - [5.19 التطبيقات (Apps Hub)](#519-التطبيقات-apps-hub)
   - [5.20 Webhooks](#520-webhooks)
   - [5.21 النماذج (Form Views)](#521-النماذج-form-views)
   - [5.22 لوحة تحكم مخصصة (Custom Dashboard)](#522-لوحة-تحكم-مخصصة-custom-dashboard)
   - [5.23 مهامي (My Tasks)](#523-مهامي-my-tasks)
   - [5.24 الإعدادات (Settings)](#524-الإعدادات-settings)
   - [5.25 الاشتراكات والتسعير (Pricing)](#525-الاشتراكات-والتسعير-pricing)
6. [API Endpoints](#6-api-endpoints)
7. [نماذج قاعدة البيانات (MongoDB Models)](#7-نماذج-قاعدة-البيانات-mongodb-models)
8. [متغيرات البيئة المطلوبة (ENV)](#8-متغيرات-البيئة-المطلوبة-env)
9. [النشر والبنية التحتية (Deploy)](#9-النشر-والبنية-التحتية-deploy)
10. [خطط الاشتراك](#10-خطط-الاشتراك)
11. [الدولية وتعدد اللغات](#11-الدولية-وتعدد-اللغات)

---

## 1. نظرة عامة على المشروع

Julay هي منصة SaaS لإدارة المشاريع بالذكاء الاصطناعي.

| البند | التفاصيل |
|-------|---------|
| الموقع | https://julay.org |
| النوع | SaaS - Project Management |
| الجمهور | الفرق والشركات (3–500 مستخدم) |
| الميزة الرئيسية | Claude AI يُنشئ الخطط والمهام والتقارير تلقائياً |
| المنافسون | Monday.com, Asana, Jira, Linear |

---

## 2. المكدس التقني (Tech Stack)

### Frontend
| التقنية | الإصدار | الاستخدام |
|---------|---------|----------|
| React | 18 | مكتبة واجهة المستخدم |
| Vite | latest | أداة البناء |
| Material UI (MUI) | v6 | نظام التصميم - `sx` prop فقط، لا CSS خارجية |
| Redux Toolkit | latest | إدارة الحالة العامة |
| React Router | v6 | التوجيه (lazy loading) |
| i18next | latest | 10 لغات |
| Recharts | latest | الرسوم البيانية |
| date-fns | latest | التعامل مع التواريخ |
| Capacitor | latest | تطبيق موبايل |

### Backend
| التقنية | الإصدار | الاستخدام |
|---------|---------|----------|
| Node.js | 18+ | بيئة التشغيل |
| Express | 4 | إطار الخادم |
| MongoDB Atlas | - | قاعدة البيانات |
| Mongoose | 7 | ODM |
| @anthropic-ai/sdk | latest | Claude AI |
| JWT | - | المصادقة |
| Helmet | - | الأمان |
| express-rate-limit | - | تحديد الطلبات |
| Morgan | - | تسجيل الطلبات |

### البنية التحتية
| العنصر | التفاصيل |
|--------|---------|
| السيرفر | AWS EC2 |
| Reverse Proxy | Nginx |
| Process Manager | PM2 |
| CI/CD | GitHub Actions (deploy.yml) |
| CORS Origins | julay.org, www.julay.org, analytics.julay.org |

---

## 3. هيكل المشروع

```
julayorg/
├── frontend/
│   └── src/
│       ├── App.jsx              # جذر التطبيق + التوجيه
│       ├── main.jsx             # نقطة الدخول
│       ├── pages/               # الصفحات (lazy loaded)
│       │   ├── Landing.jsx
│       │   ├── Auth/            # Login, Register, AcceptInvite
│       │   ├── Dashboard/       # CustomDashboard
│       │   ├── Dashboard.jsx    # لوحة التحكم الرئيسية
│       │   ├── Projects/        # ProjectList, ProjectDetail
│       │   ├── Kanban/          # KanbanBoard
│       │   ├── Timeline/        # GanttView
│       │   ├── Sprint/          # SprintBoard
│       │   ├── AI/              # AIStudio
│       │   ├── Calendar/        # CalendarView
│       │   ├── Workload/        # WorkloadView
│       │   ├── TimeTracking/    # TimeTrackingPage
│       │   ├── Reports/         # ReportsPage
│       │   ├── Automations/     # AutomationsPage
│       │   ├── Team/            # TeamView
│       │   ├── Departments/     # DepartmentsView
│       │   ├── Portfolio/       # PortfolioView
│       │   ├── Activity/        # ActivityLogPage
│       │   ├── Apps/            # AppsHub, ShareWithAI, PDFViewer
│       │   ├── Settings/        # SettingsPage, WebhooksPage
│       │   ├── Views/           # FormViewBuilder, FormViewRenderer
│       │   ├── MyTasks/         # MyTasksPage
│       │   ├── Pricing.jsx
│       │   ├── Contact.jsx
│       │   └── NotFound.jsx
│       ├── components/
│       │   ├── Layout/          # MainLayout (Sidebar + Header)
│       │   ├── AI/              # مكونات AI
│       │   ├── Gantt/           # مكونات Gantt
│       │   ├── Tasks/           # TaskCard, TaskDialog
│       │   └── common/          # StatusChip, PriorityChip, Snackbar...
│       ├── store/
│       │   └── slices/          # Redux slices
│       ├── services/
│       │   └── api.js           # جميع API calls
│       └── i18n/                # ترجمات اللغات
│
├── backend/
│   └── src/
│       ├── app.js               # إعداد Express + Middleware
│       ├── config/              # DB connection, constants
│       ├── models/              # Mongoose models
│       ├── controllers/         # منطق الأعمال
│       ├── routes/              # Express routers
│       ├── middleware/          # auth, error handlers
│       ├── services/            # AI service, email...
│       └── utils/               # مساعدات
│
├── nginx.conf                   # إعداد Nginx
├── analytics/                   # نظام التحليلات المنفصل
└── README.md
```

---

## 4. خرائط الصفحات والمسارات

### المسارات العامة (لا تتطلب تسجيل دخول)

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/` | Landing | الصفحة الرئيسية التسويقية |
| `/login` | Login | تسجيل الدخول |
| `/register` | Register | إنشاء حساب |
| `/pricing` | Pricing | خطط الاشتراك |
| `/contact` | Contact | تواصل معنا |
| `/forms/:token` | FormViewRenderer | عرض نموذج عام |
| `/accept-invite/:token` | AcceptInvitePage | قبول دعوة الفريق |

### المسارات المحمية (تتطلب تسجيل دخول)

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/dashboard` | Dashboard | لوحة التحكم الرئيسية |
| `/dashboard/projects` | ProjectList | قائمة المشاريع |
| `/dashboard/projects/:id` | ProjectDetail | تفاصيل مشروع |
| `/dashboard/projects/:id/kanban` | KanbanBoard | لوحة Kanban للمشروع |
| `/dashboard/projects/:id/timeline` | GanttView | مخطط Gantt للمشروع |
| `/dashboard/ai` | AIStudio | استوديو الذكاء الاصطناعي |
| `/dashboard/team` | TeamView | إدارة الفريق |
| `/dashboard/departments` | DepartmentsView | الأقسام |
| `/dashboard/apps` | AppsHub | مركز التطبيقات |
| `/dashboard/apps/share` | ShareWithAI | مشاركة مع AI |
| `/dashboard/apps/pdf` | PDFViewer | عارض PDF |
| `/dashboard/calendar` | CalendarView | التقويم |
| `/dashboard/workload` | WorkloadView | توزيع العمل |
| `/dashboard/automations` | AutomationsPage | قواعد الأتمتة |
| `/dashboard/reports` | ReportsPage | التقارير |
| `/dashboard/settings/webhooks` | WebhooksPage | Webhooks |
| `/dashboard/views/forms` | FormViewBuilder | بناء النماذج |
| `/dashboard/custom-dashboard` | CustomDashboard | لوحة تحكم مخصصة |
| `/dashboard/my-tasks` | MyTasksPage | مهامي |
| `/dashboard/sprints` | SprintBoard | Sprint Board |
| `/dashboard/portfolio` | PortfolioView | محفظة المشاريع |
| `/dashboard/activity` | ActivityLogPage | سجل النشاط |
| `/dashboard/settings` | SettingsPage | الإعدادات |
| `/dashboard/time-tracking` | TimeTrackingPage | تتبع الوقت |

---

## 5. الخصائص التفصيلية

---

### 5.1 الصفحة الرئيسية (Landing)

**المسار:** `/`  
**الملف:** `frontend/src/pages/Landing.jsx`

**المحتوى:**
- Hero section مع عرض توضيحي تفاعلي لـ AI
- عداد متحرك للإحصائيات (مستخدمون، مشاريع، مهام)
- قسم الميزات الرئيسية
- مقارنة مع المنافسين
- Testimonials
- CTA للتسجيل

**تجربة AI التفاعلية في الـ Landing:**
- يكتب المستخدم وصف مشروع (مثال: "تطبيق توصيل طعام")
- المنصة تُظهر مهام مُنشأة تلقائياً (demo بدون API حقيقي)
- مؤشر حالة المهام (todo / in_progress / done)

---

### 5.2 المصادقة (Auth)

**الملفات:**
- `frontend/src/pages/Auth/Login.jsx`
- `frontend/src/pages/Auth/Register.jsx`
- `frontend/src/pages/Auth/AcceptInvitePage.jsx`

**الميزات:**
- تسجيل دخول بالبريد الإلكتروني وكلمة المرور
- إنشاء حساب جديد مع إنشاء Organization تلقائي
- JWT tokens (axios interceptors تضيفها تلقائياً)
- قبول دعوات الفريق عبر رابط خاص (`/accept-invite/:token`)
- إعادة توجيه تلقائي: المستخدم المسجل ← `/dashboard`، غير المسجل ← `/login`
- Two-Factor Authentication (2FA) متاح من الإعدادات

**Rate Limiting:** 20 طلب / 15 دقيقة على مسارات Auth

---

### 5.3 لوحة التحكم (Dashboard)

**المسار:** `/dashboard`  
**الملف:** `frontend/src/pages/Dashboard.jsx`

**البطاقات الإحصائية (Stat Cards):**
| البطاقة | ما تعرضه |
|---------|---------|
| Total Projects | عدد المشاريع الكلي |
| Active Tasks | المهام النشطة |
| Team Members | أعضاء الفريق |
| Completed | المهام المنجزة |

**الرسوم البيانية:**
- Bar Chart: توزيع المهام حسب الأسبوع
- Pie Chart: توزيع المهام حسب الحالة
- Area Chart: نشاط المشاريع عبر الزمن

**ألوان الحالات:**
```
planned    → #94A3B8 (رمادي)
in_progress → #4F46E5 (بنفسجي)
blocked    → #EF4444 (أحمر)
review     → #F59E0B (برتقالي)
done       → #10B981 (أخضر)
```

**أنواع أحداث سجل النشاط:**
```
created       ✦ بنفسجي
completed     ✓ أخضر
updated       ↻ برتقالي
assigned      → أزرق
status_changed ◈ أرجواني
commented     ◉ رمادي
ai_generated  ★ بنفسجي
deleted       × أحمر
```

**Onboarding Wizard:**  
يظهر تلقائياً للمستخدم الجديد مع خطوات إرشادية لإعداد المنصة.

---

### 5.4 المشاريع (Projects)

**المسارات:**
- `/dashboard/projects` → قائمة المشاريع
- `/dashboard/projects/:id` → تفاصيل المشروع
- `/dashboard/projects/:id/kanban` → Kanban
- `/dashboard/projects/:id/timeline` → Gantt

**الملفات:**
- `frontend/src/pages/Projects/ProjectList.jsx`
- `frontend/src/pages/Projects/ProjectDetail.jsx`

**خصائص المشروع:**
```
name         اسم المشروع
description  الوصف
status       planned | in_progress | review | done | blocked
priority     low | medium | high | critical
startDate    تاريخ البداية
dueDate      تاريخ الانتهاء
owner        المالك
members[]    أعضاء الفريق
tags[]       الوسوم
color        لون المشروع
```

**عرض القائمة:**
- كاردات Grid مع شريط تقدم (Progress Bar)
- فلترة حسب الحالة والأولوية
- بحث نصي
- زر إنشاء مشروع جديد (يدوياً أو بالـ AI)

**تفاصيل المشروع:**
- قائمة المهام مع فلترة
- إحصائيات المشروع
- أعضاء الفريق
- تبويبات: Tasks / Kanban / Timeline

---

### 5.5 المهام (Tasks)

**نموذج المهمة (Task Model):**
```
title          عنوان المهمة
description    الوصف
status         todo | in_progress | review | done | blocked | backlog
priority       low | medium | high | critical
assignees[]    المُكلَّفون (متعدد)
project        المشروع المرتبط
sprint         الـ Sprint المرتبط
dueDate        تاريخ الاستحقاق
estimatedHours ساعات التقدير
tags[]         الوسوم
subtasks[]     المهام الفرعية
attachments[]  المرفقات
comments[]     التعليقات
```

**الأولويات وألوانها:**
```
low      → #94A3B8
medium   → #F59E0B
high     → #F97316
critical → #EF4444
urgent   → #DC2626
```

**خصائص المهام:**
- تعيين لمتعدد أشخاص (Multiple Assignees)
- مهام فرعية (Subtasks)
- تعليقات
- تتبع الوقت مرتبط بالمهمة
- Drag & Drop في Kanban
- AI اقتراح مهام (Task Suggestions)

---

### 5.6 لوحة Kanban

**المسار:** `/dashboard/projects/:id/kanban`  
**الملف:** `frontend/src/pages/Kanban/KanbanBoard.jsx`

**الأعمدة:**
```
backlog     → رمادي  #94A3B8
todo        → بنفسجي #6366F1
in_progress → برتقالي #F59E0B
review      → أرجواني #8B5CF6
done        → أخضر   #10B981
```

**الميزات:**
- Drag & Drop بين الأعمدة
- كل بطاقة تعرض: العنوان، الأولوية (نقطة ملونة)، الساعات المقدرة، صور الأعضاء
- فلترة حسب المُكلَّف
- إضافة مهام مباشرة من العمود

---

### 5.7 Gantt / Timeline

**المسار:** `/dashboard/projects/:id/timeline`  
**الملف:** `frontend/src/pages/Timeline/GanttView.jsx`  
**مكونات:** `frontend/src/components/Gantt/`

**الميزات:**
- مخطط Gantt تفاعلي
- عرض المهام على محور الزمن
- سحب لتغيير التواريخ
- عرض التبعيات
- تكبير/تصغير المحور الزمني (يوم / أسبوع / شهر)

---

### 5.8 Sprint Board

**المسار:** `/dashboard/sprints`  
**الملف:** `frontend/src/pages/Sprint/SprintBoard.jsx`

**مفهوم الـ Sprint:**
- فترة زمنية محددة (عادة 2 أسبوع)
- مهام تُسحب من الـ Backlog

**أعمدة Sprint:**
```
backlog     → رمادي
todo        → بنفسجي
in_progress → برتقالي
review      → أرجواني
done        → أخضر
```

**معلومات Sprint:**
- اسم الـ Sprint
- تاريخ البداية والنهاية
- عداد الأيام المتبقية (`daysRemaining`)
- نقاط التقدير (Story Points = estimatedHours)
- حالة Sprint: active / planning / completed

**الميزات:**
- إنشاء Sprint جديد
- سحب مهام من الـ Backlog
- إزالة مهام من الـ Sprint
- بطاقات المهام تعرض: العنوان، الأولوية، النقاط، الأعضاء

---

### 5.9 الذكاء الاصطناعي AI Studio

**المسار:** `/dashboard/ai`  
**الملف:** `frontend/src/pages/AI/AIStudio.jsx`  
**Rate Limit:** 20 طلب / دقيقة

**أدوات AI المتاحة:**

#### 1. توليد خطة المشروع (Generate Plan)
- المدخل: وصف نصي للمشروع
- المخرج: مهام مُهيكَلة مع أولويات وتواريخ وتعيينات
- يستخدم MongoDB transactions للذرية (Atomicity)

#### 2. تقرير Standup اليومي
- اختيار مشروع
- Claude يُنشئ ملخص الحالة
- مؤشر الصحة: green / yellow / red
- AI Insights: اقتراحات لتحسين سير العمل

#### 3. تحليل الأداء (Performance Analysis)
- اختيار مشروع
- نتيجة مئوية للأداء (0-100%)
- مؤشر: On Track / At Risk
- توصيات محددة

#### 4. إعادة التخطيط (Replan)
- اختيار مشروع + سبب التغيير
- Claude يُعيد ترتيب المهام والجداول

**الـ Redux Slice:** `store/slices/aiSlice.js`  
```
generatePlan()
getStandup(projectId)
analyzePerformance(projectId)
replanProject({ projectId, reason })
```

---

### 5.10 التقويم (Calendar)

**المسار:** `/dashboard/calendar`  
**الملف:** `frontend/src/pages/Calendar/CalendarView.jsx`

**الميزات:**
- عرض شهري/أسبوعي
- مهام بتواريخ استحقاق على التقويم
- فلترة حسب المشروع
- النقر على يوم لإضافة مهمة

---

### 5.11 توزيع العمل (Workload)

**المسار:** `/dashboard/workload`  
**الملف:** `frontend/src/pages/Workload/WorkloadView.jsx`

**مفهوم الـ Workload:**
جدول أسبوعي يعرض عدد الساعات المخصصة لكل عضو.

**مؤشر الطاقة (Capacity):**
```
≤ 60%  → Ok    (أخضر  #10B981)
≤ 90%  → Busy  (برتقالي #F59E0B)
> 90%  → Over  (أحمر  #EF4444)
```

**الميزات:**
- جدول أسبوعي (Mon-Sun)
- كل خلية تعرض الساعات المخصصة / الطاقة الكلية
- Tooltip يعرض قائمة المهام في تلك الخلية
- Drawer يفتح عند اختيار عضو لعرض تفاصيله
- زر AI Suggestions لتوزيع العمل بشكل أمثل

---

### 5.12 تتبع الوقت (Time Tracking)

**المسار:** `/dashboard/time-tracking`  
**الملف:** `frontend/src/pages/TimeTracking/TimeTrackingPage.jsx`

**الميزات:**

#### تايمر مباشر
- Start / Stop
- ربط التايمر بمهمة محددة
- إضافة وصف
- عرض الوقت بصيغة `HH:MM:SS`

#### إدخال يدوي
- اختيار المهمة
- تحديد وقت البداية والنهاية
- وصف
- تحديد billable / non-billable

#### تقرير الوقت
- إجمالي الساعات
- توزيع حسب المشروع/المهمة
- إمكانية التصدير

---

### 5.13 التقارير (Reports)

**المسار:** `/dashboard/reports`  
**الملف:** `frontend/src/pages/Reports/ReportsPage.jsx`

**أنواع التقارير:**

| النوع | المحتوى |
|-------|---------|
| Tasks Report | توزيع المهام حسب الحالة/الأولوية/المُكلَّف |
| Projects Report | حالة المشاريع ومعدلات الإنجاز |
| Team Performance | إنتاجية الأعضاء والسرعة |
| Timeline Report | تحليل التواريخ المخططة مقابل الفعلية |

**خيارات التجميع (Group By):**
```
Tasks:    status | assignee | priority | week
Projects: status | owner
Team:     member
Timeline: project
```

**إمكانيات التصدير:**
- Print
- PDF
- تحديد نطاق تاريخ (DatePicker)
- فلترة حسب المشروع

**الرسوم البيانية:**
- Bar Chart
- Pie Chart

---

### 5.14 الأتمتة (Automations)

**المسار:** `/dashboard/automations`  
**الملف:** `frontend/src/pages/Automations/AutomationsPage.jsx`

**مفهوم الأتمتة:**  
قاعدة مكونة من: **Trigger** → **Action**

**محفزات (Triggers):**
```
task.created          عند إنشاء مهمة
task.status_changed   عند تغيير حالة مهمة
task.due_soon         عند اقتراب موعد (48 ساعة)
task.overdue          عند تأخر المهمة
task.assigned         عند تعيين مهمة
project.created       عند إنشاء مشروع
```

**إجراءات (Actions):**
```
notify_user    إرسال إشعار لمستخدم
change_status  تغيير حالة المهمة
add_comment    إضافة تعليق تلقائي
create_subtask إنشاء مهمة فرعية
```

**الميزات:**
- تفعيل/تعطيل كل قاعدة (Toggle)
- تعديل وحذف القواعد
- عرض قائمة كل القواعد مع حالتها

---

### 5.15 الفريق (Team)

**المسار:** `/dashboard/team`  
**الملف:** `frontend/src/pages/Team/TeamView.jsx`

**الميزات:**
- عرض جميع أعضاء الفريق
- الأدوار: admin / member / viewer
- إرسال دعوة بالبريد الإلكتروني
- رابط دعوة قابل للنسخ
- عرض الصلاحيات لكل عضو
- إزالة عضو من المنظمة

---

### 5.16 الأقسام (Departments)

**المسار:** `/dashboard/departments`  
**الملف:** `frontend/src/pages/Departments/DepartmentsView.jsx`

**الميزات:**
- إنشاء أقسام داخل المنظمة
- تعيين أعضاء لكل قسم
- ربط المشاريع بالأقسام
- إحصائيات لكل قسم

---

### 5.17 محفظة المشاريع (Portfolio)

**المسار:** `/dashboard/portfolio`  
**الملف:** `frontend/src/pages/Portfolio/PortfolioView.jsx`

**مؤشرات الصحة:**
```
on_track  → أخضر  #10B981 "On Track"
at_risk   → برتقالي #F59E0B "At Risk"
off_track → أحمر  #EF4444 "Off Track"
```

**الميزات:**
- عرض جميع المشاريع كـ Cards
- شريط التقدم المركب (Todo / InProgress / Done)
- فلترة حسب الحالة والصحة
- بحث نصي
- ألوان تلقائية لكل مشروع
- انتقال مباشر لتفاصيل المشروع

---

### 5.18 سجل النشاط (Activity Log)

**المسار:** `/dashboard/activity`  
**الملف:** `frontend/src/pages/Activity/ActivityLogPage.jsx`

**الميزات:**
- سجل زمني لكل الأحداث
- أحداث: إنشاء، تعديل، حذف، تعيين، تغيير حالة، تعليق، توليد AI
- تصفية حسب النوع والمستخدم
- عرض avatar المستخدم مع كل حدث
- فارق الوقت النسبي (مثل: "5 minutes ago")

---

### 5.19 التطبيقات (Apps Hub)

**المسار:** `/dashboard/apps`  
**الملف:** `frontend/src/pages/Apps/AppsHub.jsx`

**التطبيقات المتاحة:**

| التطبيق | المسار | الوصف |
|---------|--------|-------|
| Share with AI | `/dashboard/apps/share` | مشاركة مستندات مع Claude للتحليل |
| PDF Viewer | `/dashboard/apps/pdf` | عارض PDF مدمج |

---

### 5.20 Webhooks

**المسار:** `/dashboard/settings/webhooks`  
**الملف:** `frontend/src/pages/Settings/WebhooksPage.jsx`

**الميزات:**
- إنشاء Webhook URL للاستماع للأحداث
- تحديد الأحداث المُرسَلة
- اختبار Webhook
- تفعيل/تعطيل
- Secret Key للتحقق

---

### 5.21 النماذج (Form Views)

**المسارات:**
- `/dashboard/views/forms` → بناء النموذج (يتطلب تسجيل دخول)
- `/forms/:token` → عرض النموذج (عام، لا يتطلب تسجيل دخول)

**الملفات:**
- `frontend/src/pages/Views/FormViewBuilder.jsx`
- `frontend/src/pages/Views/FormViewRenderer.jsx`

**الاستخدام:**  
إنشاء نماذج مخصصة لجمع طلبات المهام أو التغذية الراجعة من خارج المنظمة.

---

### 5.22 لوحة تحكم مخصصة (Custom Dashboard)

**المسار:** `/dashboard/custom-dashboard`  
**الملف:** `frontend/src/pages/Dashboard/CustomDashboard.jsx`

**الميزات:**
- Drag & Drop للعناصر (Widgets)
- إضافة عناصر مخصصة
- حفظ التخصيص لكل مستخدم
- عرض الإحصائيات والرسوم البيانية المختارة

---

### 5.23 مهامي (My Tasks)

**المسار:** `/dashboard/my-tasks`  
**الملف:** `frontend/src/pages/MyTasks/MyTasksPage.jsx`

**الميزات:**
- عرض جميع المهام المُعيَّنة للمستخدم الحالي
- من جميع المشاريع في مكان واحد
- تصفية حسب الحالة والأولوية
- فرز حسب تاريخ الاستحقاق

---

### 5.24 الإعدادات (Settings)

**المسار:** `/dashboard/settings`  
**الملف:** `frontend/src/pages/Settings/SettingsPage.jsx`

**التبويبات:**

#### Profile Tab
```
name         الاسم الكامل
jobTitle     المسمى الوظيفي
avatar       رابط الصورة الشخصية
timezone     المنطقة الزمنية (UTC, Asia/Riyadh, ...)
language     اللغة (en, ar, fr)
```

#### Team Tab
- قائمة أعضاء الفريق
- دعوة عبر البريد
- رابط دعوة قابل للمشاركة
- تغيير دور العضو
- إزالة العضو

#### Security Tab
- تغيير كلمة المرور
- Two-Factor Authentication (2FA)
  - إعداد TOTP عبر QR Code
  - تفعيل/تعطيل 2FA

#### Notifications Tab
- تحكم في الإشعارات
- تحديد أنواع الإشعارات المُرسَلة

#### Subscription Tab
- عرض الخطة الحالية
- ترقية/تخفيض الاشتراك
- معلومات الفاتورة

#### Integrations Tab
- ربط GitHub
- ربط Google Calendar (Zoom ذُكر في الكود)
- API Keys

---

### 5.25 الاشتراكات والتسعير (Pricing)

**المسار:** `/pricing`  
**الملف:** `frontend/src/pages/Pricing.jsx`

---

## 10. خطط الاشتراك

| الخاصية | Free | Starter ($15/شهر) | Professional ($47/شهر) | Business ($79/شهر) |
|---------|------|-------------------|----------------------|-------------------|
| المشاريع | 3 | 10 | غير محدود | غير محدود |
| أعضاء الفريق | 3 | 10 | 25 | غير محدود |
| التخزين | 1 GB | 10 GB | 50 GB | 200 GB |
| AI requests/شهر | ❌ | 30 | 500 | 2,000 |
| توليد مشروع AI | ❌ | ✅ | ✅ | ✅ |
| اقتراحات AI | ❌ | ✅ | ✅ | ✅ |
| Kanban Board | ✅ | ✅ | ✅ | ✅ |
| Gantt / Timeline | ❌ | ✅ | ✅ | ✅ |
| Sprint Board | ❌ | ❌ | ✅ | ✅ |
| Time Tracking | ❌ | ✅ | ✅ | ✅ |
| Automations | ❌ | ❌ | ✅ | ✅ |
| Custom Dashboards | ❌ | ❌ | ✅ | ✅ |
| Reports & Exports | ❌ | ❌ | ✅ | ✅ |
| API & Webhooks | ❌ | ❌ | ❌ | ✅ |
| SSO / SAML | ❌ | ❌ | ❌ | ✅ |
| SLA | ❌ | ❌ | ❌ | 99.9% |

**ملاحظة:** الأسعار السنوية توفر شهرين مجاناً.  
**14-day trial** متاح للخطط Starter و Professional.

---

## 6. API Endpoints

جميع endpoints تبدأ بـ `/api/`

| Prefix | الوصف |
|--------|-------|
| `/api/auth` | تسجيل الدخول، التسجيل، تحديث التوكن |
| `/api/projects` | CRUD المشاريع |
| `/api/tasks` | CRUD المهام |
| `/api/users` | بيانات المستخدمين |
| `/api/departments` | CRUD الأقسام |
| `/api/dashboard` | إحصائيات لوحة التحكم |
| `/api/dashboard-config` | تخصيص لوحة التحكم |
| `/api/ai` | توليد الخطط والتقارير بالـ AI |
| `/api/subscription` | إدارة الاشتراكات |
| `/api/context` | سياق AI |
| `/api/calendar` | بيانات التقويم |
| `/api/workload` | بيانات توزيع العمل |
| `/api/notifications` | الإشعارات |
| `/api/automations` | CRUD قواعد الأتمتة |
| `/api/webhooks` | CRUD Webhooks |
| `/api/reports` | توليد التقارير |
| `/api/forms` | CRUD النماذج |
| `/api/sprints` | CRUD Sprints |
| `/api/time-entries` | CRUD سجلات الوقت |
| `/api/activity` | سجل النشاط |
| `/api/search` | البحث الكلي |
| `/api/my-tasks` | مهام المستخدم الحالي |
| `/api/portfolio` | بيانات المحفظة |
| `/api/2fa` | Two-Factor Authentication |
| `/api/integrations` | التكاملات الخارجية |
| `/api/analytics` | التحليلات |

**Middleware على كل Protected Route:**
- `authMiddleware` — التحقق من JWT
- `errorHandler` — معالجة الأخطاء

---

## 7. نماذج قاعدة البيانات (MongoDB Models)

| النموذج | الملف | الوصف |
|---------|-------|-------|
| User | `User.js` | المستخدم + الصلاحيات |
| Organization | `Organization.js` | المنظمة (Organization) |
| Project | `Project.js` | المشاريع |
| Task | `Task.js` | المهام + Subtasks |
| Sprint | `Sprint.js` | Sprints |
| Department | `Department.js` | الأقسام |
| TimeEntry | `TimeEntry.js` | سجلات تتبع الوقت |
| AutomationRule | `AutomationRule.js` | قواعد الأتمتة |
| Webhook | `Webhook.js` | Webhooks |
| ActivityLog | `ActivityLog.js` | سجل النشاط |
| Notification | `Notification.js` | الإشعارات |
| DashboardConfig | `DashboardConfig.js` | تخصيص لوحة التحكم |
| FormView | `FormView.js` | النماذج المخصصة |
| Invite | `Invite.js` | دعوات الفريق |
| OTP | `OTP.js` | رموز التحقق |
| Role | `Role.js` | الأدوار والصلاحيات |
| Goal | `Goal.js` | الأهداف |
| Suggestion | `Suggestion.js` | اقتراحات AI |
| PageView | `PageView.js` | تحليلات الصفحات |

---

## 8. متغيرات البيئة المطلوبة (ENV)

### Backend `.env`
```env
NODE_ENV=production
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT - يجب تعيينه (لا fallback)
JWT_SECRET=your-secret-here

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-...

# Email (لإرسال الدعوات)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...

# App URL
CLIENT_URL=https://julay.org
```

### Frontend `.env`
```env
VITE_API_URL=https://julay.org/api
```

---

## 9. النشر والبنية التحتية (Deploy)

```
Internet
    ↓
AWS EC2 Instance
    ↓
Nginx (Reverse Proxy)
    ├── / → frontend/dist (static files)
    └── /api → localhost:5000 (Node.js/Express)
         ↓
      PM2 (Process Manager)
         ↓
      MongoDB Atlas (Cloud DB)
```

**GitHub Actions (CI/CD):**
- عند Push على `main`
- يبني الـ frontend
- ينقل الملفات للسيرفر
- يُعيد تشغيل PM2
- يستخدم `${{ secrets.DEPLOY_HOST }}` (IP مشفر في GitHub Secrets)

**ملف Nginx:** `nginx.conf` في جذر المشروع

---

## 11. الدولية وتعدد اللغات

**مكتبة:** i18next  
**اللغات المدعومة:** 10 لغات  
**الملفات:** `frontend/src/i18n/`

**اللغات المذكورة في الكود:**
- English (en)
- Arabic (ar) - RTL
- French (fr)
- وأخرى...

**تبديل اللغة:**
- من صفحة الإعدادات (Settings → Profile → Language)
- من الـ Landing page عبر `LanguageSwitcher`

---

## ملاحظات هامة للمطور

### قواعد الكود
1. **Frontend:** استخدم `sx` prop من MUI فقط — لا ملفات CSS منفصلة
2. **Backend:** نمط MVC (Model → Controller → Route)
3. **JWT:** يجب وجود `JWT_SECRET` كمتغير بيئة — لا قيمة افتراضية
4. **AI:** Rate limit: 20 طلب/دقيقة لمسارات AI
5. **Auth:** Rate limit: 20 طلب/15 دقيقة لمسارات Auth

### مناطق حساسة
- `generatePlan` في AI Controller يستخدم **MongoDB transactions** — لا تُعدِّل هذا بدون فهم كامل
- مسار `/api/dashboard-config/` منفصل عن `/api/dashboard/` — لا تدمجهما
- CORS مضبوط بقائمة محددة من Origins — أضف أي domain جديد في `app.js`

### لتشغيل المشروع محلياً
```bash
# Backend
cd backend
npm install
cp .env.example .env   # عدّل القيم
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

*آخر تحديث: أبريل 2026*
