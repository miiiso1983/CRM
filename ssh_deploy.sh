#!/bin/bash
# ============================================================
#  Al Team CRM — Local SSH Deployment Script
#  يشتغل من جهازك ويرفع كل شيء للسيرفر تلقائياً
# ============================================================
#  الاستخدام:
#    ./ssh_deploy.sh             ← نشر كامل (frontend + backend)
#    ./ssh_deploy.sh --frontend  ← frontend فقط
#    ./ssh_deploy.sh --backend   ← backend فقط
#    ./ssh_deploy.sh --restart   ← إعادة تشغيل البيرفر فقط
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============ الألوان ============
RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log_step()    { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
log_info()    { echo -e "${BLUE}  ▶${NC} $1"; }
log_success() { echo -e "${GREEN}  ✅${NC} $1"; }
log_warn()    { echo -e "${YELLOW}  ⚠️${NC}  $1"; }
log_error()   { echo -e "${RED}  ❌${NC} $1"; exit 1; }

# ============ قراءة ملف الإعدادات ============
CONFIG_FILE="$SCRIPT_DIR/.deploy.config"
if [ ! -f "$CONFIG_FILE" ]; then
    log_warn "ملف .deploy.config غير موجود."
    echo -e "  إنشاؤه من النموذج: ${YELLOW}cp .deploy.config.example .deploy.config${NC}"
    echo ""
    log_info "أو أدخل البيانات الآن:"
    read -rp "  SSH Host (IP الخاص بالسيرفر): " SSH_HOST
    read -rp "  SSH Port [22]: " SSH_PORT;       SSH_PORT=${SSH_PORT:-22}
    read -rp "  SSH User [master]: " SSH_USER;   SSH_USER=${SSH_USER:-master}
    read -rp "  SSH Key Path [~/.ssh/id_rsa]: " SSH_KEY; SSH_KEY=${SSH_KEY:-~/.ssh/id_rsa}
    read -rp "  Remote App Path (مثال: /home/master/applications/myfolder): " REMOTE_APP_PATH
    read -rp "  DB Name [alteam_crm]: " DB_NAME;  DB_NAME=${DB_NAME:-alteam_crm}
    read -rp "  DB User: " DB_USER
    read -rsp "  DB Password: " DB_PASS; echo ""
    read -rp "  Backend Port [5001]: " BACKEND_PORT; BACKEND_PORT=${BACKEND_PORT:-5001}
    JWT_SECRET="AlTeam_CRM_Secret_$(date +%s)"
    # حفظ الإعدادات
    cat > "$CONFIG_FILE" <<CFGEOF
SSH_HOST=$SSH_HOST
SSH_PORT=$SSH_PORT
SSH_USER=$SSH_USER
SSH_KEY=$SSH_KEY
REMOTE_APP_PATH=$REMOTE_APP_PATH
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
BACKEND_PORT=$BACKEND_PORT
JWT_SECRET=$JWT_SECRET
CFGEOF
    log_success "تم حفظ الإعدادات في .deploy.config"
else
    source "$CONFIG_FILE"
    log_success "تم تحميل إعدادات .deploy.config"
fi

# ============ التحقق من الإعدادات الأساسية ============
[ -z "$SSH_HOST" ]          && log_error "SSH_HOST غير محدد في .deploy.config"
[ -z "$REMOTE_APP_PATH" ]   && log_error "REMOTE_APP_PATH غير محدد في .deploy.config"
SSH_KEY="${SSH_KEY/#\~/$HOME}"
[ ! -f "$SSH_KEY" ]         && log_error "مفتاح SSH غير موجود: $SSH_KEY"

# ============ المتغيرات المشتقة ============
REMOTE_PUBLIC_HTML="$REMOTE_APP_PATH/public_html"
REMOTE_BACKEND="$REMOTE_APP_PATH/backend"
SSH_OPTS="-p $SSH_PORT -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=15"
SSH_CMD="ssh $SSH_OPTS $SSH_USER@$SSH_HOST"
RSYNC_SSH="rsync -avz --progress -e 'ssh $SSH_OPTS'"

# ============ وضع النشر (arguments) ============
DEPLOY_FRONTEND=true
DEPLOY_BACKEND=true
case "$1" in
    --frontend) DEPLOY_BACKEND=false ;;
    --backend)  DEPLOY_FRONTEND=false ;;
    --restart)  DEPLOY_FRONTEND=false; DEPLOY_BACKEND=false ;;
esac

# ============ الترويسة ============
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Al Team CRM — SSH Deployment Script      ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC}  🌐 Host : ${CYAN}$SSH_HOST:$SSH_PORT${NC}"
echo -e "${BLUE}║${NC}  👤 User : ${CYAN}$SSH_USER${NC}"
echo -e "${BLUE}║${NC}  📁 Path : ${CYAN}$REMOTE_APP_PATH${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ============ 1. اختبار الاتصال بالسيرفر ============
log_step "1. اختبار الاتصال بالسيرفر"
$SSH_CMD "echo 'Connection OK'" &>/dev/null \
    && log_success "الاتصال بالسيرفر ناجح" \
    || log_error "تعذّر الاتصال بـ $SSH_HOST — تحقق من IP ومفتاح SSH"

# ============ 2. بناء Frontend محلياً ============
if [ "$DEPLOY_FRONTEND" = true ]; then
    log_step "2. بناء Frontend محلياً"
    cd "$SCRIPT_DIR/frontend"
    log_info "تثبيت packages..."
    npm install --silent
    log_info "بناء المشروع..."
    npm run build
    log_success "تم بناء Frontend في frontend/dist"
fi

# ============ 3. رفع Frontend للسيرفر ============
if [ "$DEPLOY_FRONTEND" = true ]; then
    log_step "3. رفع Frontend → $REMOTE_PUBLIC_HTML"
    $SSH_CMD "mkdir -p $REMOTE_PUBLIC_HTML"
    rsync -avz --progress --delete \
        -e "ssh $SSH_OPTS" \
        "$SCRIPT_DIR/frontend/dist/" \
        "$SSH_USER@$SSH_HOST:$REMOTE_PUBLIC_HTML/"
    log_success "تم رفع ملفات Frontend"
fi

# ============ 4. رفع Backend للسيرفر ============
if [ "$DEPLOY_BACKEND" = true ]; then
    log_step "4. رفع Backend → $REMOTE_BACKEND"
    $SSH_CMD "mkdir -p $REMOTE_BACKEND/logs"
    rsync -avz --progress \
        -e "ssh $SSH_OPTS" \
        --exclude='node_modules' \
        --exclude='.env' \
        --exclude='*.log' \
        --exclude='.git' \
        "$SCRIPT_DIR/backend/" \
        "$SSH_USER@$SSH_HOST:$REMOTE_BACKEND/"
    log_success "تم رفع ملفات Backend"
fi

# ============ 5. إعداد .env على السيرفر ============
if [ "$DEPLOY_BACKEND" = true ]; then
    log_step "5. إعداد .env على السيرفر"
    $SSH_CMD "
    if [ ! -f '$REMOTE_BACKEND/.env' ]; then
        cat > '$REMOTE_BACKEND/.env' << 'ENVEOF'
PORT=${BACKEND_PORT:-5001}
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${DB_NAME:-alteam_crm}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
JWT_SECRET=${JWT_SECRET:-AlTeam_CRM_Secret_2024}
JWT_EXPIRE=7d
APP_URL=https://phpstack-1492540-6293582.cloudwaysapps.com
FRONTEND_URL=https://phpstack-1492540-6293582.cloudwaysapps.com
ENVEOF
        echo 'ENV_CREATED'
    else
        echo 'ENV_EXISTS'
    fi
    "
    log_success "ملف .env جاهز على السيرفر"
fi

# ============ 6. تثبيت Dependencies وتشغيل PM2 ============
if [ "$DEPLOY_BACKEND" = true ] || [ "$1" = "--restart" ]; then
    log_step "6. تثبيت Dependencies وتشغيل Backend"
    $SSH_CMD "
    set -e
    cd '$REMOTE_BACKEND'
    echo '▶ تثبيت npm packages...'
    npm install --production --silent
    echo '▶ إعداد PM2...'
    if ! command -v pm2 &>/dev/null; then
        npm install -g pm2
    fi
    pm2 delete crm-backend 2>/dev/null || true
    pm2 start server.js \
        --name 'crm-backend' \
        --max-memory-restart 300M \
        --log '$REMOTE_BACKEND/logs/app.log' \
        --error '$REMOTE_BACKEND/logs/error.log' \
        --time
    pm2 save
    echo '▶ حالة PM2:'
    pm2 list
    "
    log_success "Backend يعمل على port ${BACKEND_PORT:-5001}"
fi

# ============ 7. التحقق من الـ API ============
log_step "7. التحقق من الـ API"
sleep 3
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://phpstack-1492540-6293582.cloudwaysapps.com/api/health" 2>/dev/null || echo "000")

if [ "$API_STATUS" = "200" ]; then
    log_success "API يعمل بنجاح ✅ (HTTP $API_STATUS)"
else
    log_warn "API أعاد كود: $API_STATUS — تحقق من Nginx وPM2"
    log_info "لمشاهدة الـ logs: $SSH_CMD 'pm2 logs crm-backend --lines 30'"
fi

# ============ النهاية ============
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         تم النشر بنجاح! 🎉                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 الموقع  : ${CYAN}https://phpstack-1492540-6293582.cloudwaysapps.com${NC}"
echo -e "  📡 API     : ${CYAN}https://phpstack-1492540-6293582.cloudwaysapps.com/api/health${NC}"
echo -e "  🔑 Admin   : ${CYAN}admin@alteam.com${NC} / ${CYAN}Admin@123${NC}"
echo ""
echo -e "  ${YELLOW}أوامر مفيدة:${NC}"
echo -e "  مشاهدة logs   → ${CYAN}$SSH_CMD 'pm2 logs crm-backend'${NC}"
echo -e "  إعادة تشغيل  → ${CYAN}./ssh_deploy.sh --restart${NC}"
echo -e "  frontend فقط  → ${CYAN}./ssh_deploy.sh --frontend${NC}"
echo -e "  backend فقط   → ${CYAN}./ssh_deploy.sh --backend${NC}"
echo ""

