#!/bin/bash
# ============================================================
# Al Team CRM - Cloudways Deployment Script
# ============================================================
# كيفية الاستخدام:
# 1. اتصل بـ SSH من Cloudways → Application → SSH Terminal
# 2. شغّل هذا الأمر:
#    bash <(curl -s https://raw.githubusercontent.com/miiiso1983/CRM/main/deploy.sh)
# ============================================================

set -e  # إيقاف السكريبت فور حدوث أي خطأ

# ============ الألوان للطباعة ============
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅ OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[⚠️  WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[❌ ERROR]${NC} $1"; exit 1; }

# ============ المسارات ============
APP_ROOT="/home/master/applications"
# ← عدّل هذا الاسم ليطابق اسم تطبيقك في Cloudways
APP_NAME=$(ls "$APP_ROOT" 2>/dev/null | head -1)
PUBLIC_HTML="$APP_ROOT/$APP_NAME/public_html"
BACKEND_DIR="$APP_ROOT/$APP_NAME/backend"
REPO_URL="https://github.com/miiiso1983/CRM.git"
BACKEND_PORT=5001

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Al Team CRM - Deployment Script       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ============ 1. التحقق من Node.js ============
log_info "التحقق من Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js غير مثبت! ثبّته من Cloudways → Application → Node.js"
fi
NODE_VER=$(node -v)
log_success "Node.js $NODE_VER متاح"

# ============ 2. التحقق من PM2 ============
log_info "التحقق من PM2..."
if ! command -v pm2 &> /dev/null; then
    log_info "تثبيت PM2..."
    npm install -g pm2 || log_error "فشل تثبيت PM2"
fi
log_success "PM2 متاح: $(pm2 -v)"

# ============ 3. إنشاء المجلدات ============
log_info "إنشاء مجلد Backend..."
mkdir -p "$BACKEND_DIR"

# ============ 4. سحب الكود من GitHub ============
log_info "سحب الكود من GitHub..."
if [ -d "$BACKEND_DIR/.git" ]; then
    cd "$BACKEND_DIR"
    git pull origin main
    log_success "تم تحديث الكود"
else
    # نسخ Backend فقط من المشروع
    TMP_DIR="/tmp/crm_deploy_$$"
    git clone --depth=1 "$REPO_URL" "$TMP_DIR"
    cp -r "$TMP_DIR/backend/." "$BACKEND_DIR/"
    rm -rf "$TMP_DIR"
    log_success "تم تنزيل الكود"
fi

# ============ 5. تثبيت الـ Dependencies ============
log_info "تثبيت dependencies..."
cd "$BACKEND_DIR"
npm install --production --silent
log_success "تم تثبيت dependencies"

# ============ 6. إنشاء ملف .env ============
log_info "إعداد ملف .env..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    log_warn "ملف .env غير موجود — سيتم إنشاؤه. يجب تعديله بمعلومات قاعدة البيانات!"
    cat > "$BACKEND_DIR/.env" << 'ENVEOF'
# ====== Al Team CRM Production Config ======
PORT=5001
NODE_ENV=production

# ← عدّل هذه القيم من: Cloudways → Application → Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alteam_crm
DB_USER=CHANGE_ME_DB_USER
DB_PASS=CHANGE_ME_DB_PASS

JWT_SECRET=AlTeam_CRM_Secret_2024_Change_This_Value
JWT_EXPIRE=7d

APP_URL=https://phpstack-1492540-6293582.cloudwaysapps.com
FRONTEND_URL=https://phpstack-1492540-6293582.cloudwaysapps.com
ENVEOF
    echo ""
    log_warn "═══════════════════════════════════════════════"
    log_warn " يجب تعديل .env قبل تشغيل السيرفر!"
    log_warn " الأمر: nano $BACKEND_DIR/.env"
    log_warn "═══════════════════════════════════════════════"
    echo ""
else
    log_success "ملف .env موجود"
fi

# ============ 7. تشغيل Backend مع PM2 ============
log_info "تشغيل Backend..."
cd "$BACKEND_DIR"
pm2 delete crm-backend 2>/dev/null || true
pm2 start server.js \
    --name "crm-backend" \
    --max-memory-restart 300M \
    --log "$BACKEND_DIR/logs/app.log" \
    --error "$BACKEND_DIR/logs/error.log" \
    --time
pm2 save
log_success "Backend يعمل على port $BACKEND_PORT"

# ============ 8. إعداد PM2 للبدء مع السيرفر ============
log_info "إعداد PM2 startup..."
pm2 startup 2>/dev/null || log_warn "شغّل أمر PM2 startup يدوياً إذا احتجت"

# ============ 9. عرض الحالة ============
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         تم النشر بنجاح! 🎉               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
pm2 list
echo ""
log_info "للتحقق من الـ API: curl https://phpstack-1492540-6293582.cloudwaysapps.com/api/health"
log_info "لمشاهدة logs:      pm2 logs crm-backend"
log_info "لإعادة التشغيل:    pm2 restart crm-backend"

