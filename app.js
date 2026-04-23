// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDQOvyd3ygrCiQLapCw7gdg_9ycE2DC2kM",
    authDomain: "threshold-54fed.firebaseapp.com",
    databaseURL: "https://threshold-54fed-default-rtdb.firebaseio.com",
    projectId: "threshold-54fed",
    storageBucket: "threshold-54fed.firebasestorage.app",
    messagingSenderId: "932638458528",
    appId: "1:932638458528:web:fb584925a2f59abc9e7fc5",
    measurementId: "G-J6VWHYQF64"
  };

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// App variables
let currentUser = null;
let appointments = [];
let clients = [];
let statistics = {
    monthlyProfit: 0,
    receivedProfit: 0,
    remainingProfit: 0,
    clientsCount: 0,
    appointmentsCount: 0,
    attendanceRate: 0
};
let revenueChart = null;
let currentMessageData = null;
let deletedItems = [];
let customServices = [];
let currentPrintAppointment = null;

// Sample data for offline use
const sampleAppointments = [
    {
        id: "1",
        clientName: "سارة محمد",
        clientPhone: "07701234567",
        dateTime: new Date().getTime(),
        serviceType: "جلسة علاج التصبغات",
        totalPrice: 150000,
        paidAmount: 50000,
        notes: "جلسة علاج أولى",
        status: "confirmed"
    },
    {
        id: "2",
        clientName: "علي حسن",
        clientPhone: "07707654321",
        dateTime: new Date().getTime() + 86400000,
        serviceType: "حقن البوتوكس",
        totalPrice: 200000,
        paidAmount: 100000,
        notes: "متابعة بعد شهر",
        status: "confirmed",
        appointmentType: "followup",
        followupDetails: {
            sessions: 3,
            interval: 7,
            currentSession: 1
        }
    }
];

const sampleClients = [
    {
        id: "1",
        name: "سارة محمد",
        phone: "07701234567",
        email: "sara@example.com",
        appointmentsCount: 3,
        createdAt: new Date().getTime() - 86400000,
        lastAppointment: new Date().getTime()
    },
    {
        id: "2",
        name: "علي حسن",
        phone: "07707654321",
        email: "ali@example.com",
        appointmentsCount: 2,
        createdAt: new Date().getTime() - 172800000,
        lastAppointment: new Date().getTime() - 86400000
    }
];

// Service messages mapping
const serviceMessages = {
    "جلسة علاج التصبغات": {
        title: "🌸 جلسة علاج التصبغات",
        message: "✨ تذكير ✨\nلا تخلين التصبغات تغطي إشراقة وجهچ 🌷\nموعدچ الجاي ويانه حتى نوحّد لون البشرة ونخليها صافية."
    },
    "جلسة العناية بالبشرة": {
        title: "🌸 جلسة العناية بالبشرة",
        message: "✨ موعدچ ويانه ✨\nبشرتچ مثل الورد تحتاج دلع 🌸\nجلسة العناية الجاية ترجع نضارتها وتهدّيها."
    },
    "حقن البوتوكس": {
        title: "💉 حقن البوتوكس",
        message: "✨ لا تفكرين بالخطوط ✨\nموعدچ الجاي للبوتوكس 💉\nيبقى وجهچ ناعم وشبابه حاضر."
    },
    "حقن الفيلر": {
        title: "💎 حقن الفيلر",
        message: "✨ لمسة جمال ✨\nموعدچ الجاي للفيلر 💎\nيزيد ملامحچ حلاوة ويخليها متناسقة أكثر."
    },
    "حقن الميزوثرابي": {
        title: "💧 حقن الميزوثرابي",
        message: "✨ دلع لبشرتچ ✨\nجلسة الميزوثرابي الجاية ترجع ترطيبها وتخليها تشعّ نضارة 💧"
    },
    "علاج تساقط الشعر": {
        title: "💆‍♀️ علاج تساقط الشعر",
        message: "✨ شعرچ زينة تاجچ ✨\nموعدچ الجاي علاج تساقط الشعر 🌹\nحتى يرجع قوي وحيوي."
    },
    "علاج الهالات السوداء": {
        title: "👁️ علاج الهالات السوداء",
        message: "✨ خلي عيونچ تبرق ✨\nموعدچ الجاي نعالج الهالات 🌸\nونرجع إشراقة عيونچ."
    },
    "علاج حب الشباب": {
        title: "🌸 علاج حب الشباب",
        message: "✨ بشرة صافية ✨\nجلسة علاج حب الشباب الجاية 💎\nحتى يروح التعب وتبقى بشرتچ صافية."
    },
    "علاج آثار حب الشباب": {
        title: "🌸 علاج آثار حب الشباب",
        message: "✨ وداعاً للآثار ✨\nموعدچ الجاي علاج آثار الحبوب 🌷\nوترجع بشرتچ ناعمة ومتجانسة."
    },
    "حقن فيلر الشفاه": {
        title: "💄 حقن فيلر الشفاه",
        message: "✨ ابتسامة تجنن ✨\nموعدچ الجاي فيلر شفايف 💋\nيخلي ابتسامتچ أنوثة كاملة."
    },
    "التغيير الشامل بالفيلر": {
        title: "👑 التغيير الشامل بالفيلر",
        message: "✨ إطلالة جديدة ✨\nموعدچ الجاي تغيير شامل بالفيلر 💎\nحتى تبدي فصل جديد من جمالچ وثقتچ."
    },
    "أخرى": {
        title: "📅 موعد في العيادة",
        message: "✨ تذكير ✨\nموعدچ الجاي ويانه في عيادتنا 🌸\nنشكرك على ثقتك بنا ونتمنى رؤيتك في الموعد المحدد."
    }
};

// Login function
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    loginText.textContent = 'جاري تسجيل الدخول...';
    loginSpinner.style.display = 'inline-block';
    loginBtn.disabled = true;
    
    try {
        if (username === 'yehia' && password === '1111') {
            // حفظ بيانات الدخول إذا تم اختيار "تذكرني"
            if (rememberMe) {
                localStorage.setItem('savedUsername', username);
                localStorage.setItem('savedPassword', password);
                localStorage.setItem('rememberMe', 'true');
            } else {
                // مسح البيانات المحفوظة إذا لم يتم اختيار "تذكرني"
                localStorage.removeItem('savedUsername');
                localStorage.removeItem('savedPassword');
                localStorage.removeItem('rememberMe');
            }
            
            await auth.signInAnonymously();
            showAlert('success', 'تم تسجيل الدخول بنجاح');
            
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('appContent').style.display = 'block';
            setupInstallPrompt();
            
            loadAllData();
        } else {
            throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('error', error.message);
    } finally {
        loginText.textContent = 'تسجيل الدخول';
        loginSpinner.style.display = 'none';
        loginBtn.disabled = false;
    }
});

// Logout function
document.getElementById('logoutBtn').addEventListener('click', function() {
    // مسح بيانات تسجيل الدخول المحفوظة عند تسجيل الخروج
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
    localStorage.removeItem('rememberMe');
    
    auth.signOut().then(() => {
        document.getElementById('appContent').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('loginForm').reset();
        showAlert('success', 'تم تسجيل الخروج بنجاح');
    }).catch(error => {
        console.error('Logout error:', error);
        showAlert('error', 'حدث خطأ أثناء تسجيل الخروج');
    });
});

// Load all data
function loadAllData() {
    loadAppointments()
        .then(() => loadClients())
        .then(() => loadStatistics())
        .then(() => loadDeletedItems())
        .then(() => loadCustomServices())
        .then(() => {
            renderDashboard();
            renderUpcomingAppointments();
            renderPopularServices();
            checkForReminders();
            setInterval(checkForReminders, 60 * 60 * 1000);
            setupPhoneClickHandlers();
        })
        .catch(error => {
            console.error("Error loading data:", error);
            useSampleData();
        });
}

// Loading functions
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'global-loading';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.querySelector('.global-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Data loading functions
async function loadAppointments() {
    try {
        const appointmentsRef = database.ref('appointments');
        appointmentsRef.on('value', (snapshot) => {
            appointments = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const appointment = childSnapshot.val();
                    appointment.id = childSnapshot.key;
                    appointments.push(appointment);
                });
                showAlert('success', 'تم تحديث قائمة المواعيد');
            } else {
                console.log("لا توجد مواعيد في قاعدة البيانات");
                showAlert('warning', 'لا توجد مواعيد مسجلة');
            }
            renderAppointments();
            renderUpcomingAppointments();
            renderDashboardUpcoming();
        });
    } catch (error) {
        console.error("Error loading appointments:", error);
        throw error;
    }
}

async function loadClients() {
    try {
        const clientsRef = database.ref('clients');
        clientsRef.on('value', (snapshot) => {
            clients = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const client = childSnapshot.val();
                    client.id = childSnapshot.key;
                    clients.push(client);
                });
            } else {
                console.log("لا يوجد عملاء في قاعدة البيانات");
            }
            renderClients();
        });
    } catch (error) {
        console.error("Error loading clients:", error);
        throw error;
    }
}

async function loadStatistics() {
    try {
        const statsRef = database.ref('statistics');
        statsRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                statistics = snapshot.val();
            } else {
                console.log("لا توجد إحصائيات في قاعدة البيانات");
                calculateStatistics();
            }
            renderStatistics();
            renderDashboard();
        });
    } catch (error) {
        console.error("Error loading statistics:", error);
        throw error;
    }
}

async function loadDeletedItems() {
    try {
        const deletedRef = database.ref('deletedItems');
        deletedRef.on('value', (snapshot) => {
            deletedItems = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const item = childSnapshot.val();
                    item.id = childSnapshot.key;
                    deletedItems.push(item);
                });
            }
            renderDeletedItems();
        });
    } catch (error) {
        console.error("Error loading deleted items:", error);
    }
}

async function loadCustomServices() {
    try {
        const servicesRef = database.ref('customServices');
        servicesRef.on('value', (snapshot) => {
            customServices = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const service = childSnapshot.val();
                    service.id = childSnapshot.key;
                    customServices.push(service);
                });
            }
            updateServiceDropdown();
        });
    } catch (error) {
        console.error("Error loading custom services:", error);
    }
}

function calculateStatistics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const monthlyAppointments = appointments.filter(a => a.dateTime >= monthStart);
    const todayAppointments = appointments.filter(a => a.dateTime >= todayStart && a.dateTime < todayStart + 86400000);
    
    const monthlyRevenue = monthlyAppointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const receivedRevenue = monthlyAppointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
    
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const attendanceRate = appointments.length > 0 ? 
        Math.round((completedAppointments / appointments.length) * 100) : 0;
    
    statistics = {
        monthlyProfit: monthlyRevenue,
        receivedProfit: receivedRevenue,
        remainingProfit: monthlyRevenue - receivedRevenue,
        clientsCount: clients.length,
        appointmentsCount: appointments.length,
        todayAppointmentsCount: todayAppointments.length,
        attendanceRate: attendanceRate
    };
}

function useSampleData() {
    console.log("استخدام البيانات التجريبية");
    appointments = sampleAppointments;
    clients = sampleClients;
    calculateStatistics();
    
    renderAppointments();
    renderUpcomingAppointments();
    renderDashboard();
    renderClients();
    renderStatistics();
    
    showAlert('warning', 'تم تحميل بيانات تجريبية بسبب مشكلة في الاتصال');
}

// Rendering functions
function renderDashboard() {
    if (!document.getElementById('dashboard').classList.contains('active')) return;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayAppointments = appointments.filter(a => a.dateTime >= todayStart && a.dateTime < todayStart + 86400000);
    
    // استخدام receivedProfit بدلاً من monthlyProfit
    document.getElementById('dashboardMonthlyProfit').textContent = formatCurrency(statistics.receivedProfit || 0);
    document.getElementById('dashboardClientsCount').textContent = statistics.clientsCount || 0;
    document.getElementById('dashboardAppointmentsCount').textContent = statistics.todayAppointmentsCount || todayAppointments.length;
    document.getElementById('dashboardAttendanceRate').textContent = (statistics.attendanceRate || 0) + '%';
    
    renderDashboardUpcoming();
    renderDashboardPopularServices();
}

function renderDashboardUpcoming() {
    const container = document.getElementById('dashboardUpcomingList');
    if (!container) return;
    
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const upcomingAppointments = appointments
        .filter(appointment => {
            const appointmentDate = new Date(appointment.dateTime);
            return appointmentDate >= now && appointmentDate <= threeDaysLater && 
                   appointment.status !== 'completed' && appointment.status !== 'cancelled';
        })
        .sort((a, b) => a.dateTime - b.dateTime)
        .slice(0, 5);
    
    if (upcomingAppointments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--light-text);">لا توجد مواعيد قادمة خلال الـ3 أيام القادمة</p>';
        return;
    }
    
    container.innerHTML = '';
    
    upcomingAppointments.forEach(appointment => {
        const item = document.createElement('div');
        item.className = 'upcoming-item';
        
        const timeDiff = new Date(appointment.dateTime).getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        item.innerHTML = `
            <div class="upcoming-client">
                <div class="upcoming-avatar">${appointment.clientName ? appointment.clientName.charAt(0) : '?'}</div>
                <div>
                    <div style="font-weight: 600;">${appointment.clientName || 'غير معروف'}</div>
                    <div style="font-size: 13px; color: var(--light-text);">
                        ${appointment.serviceType || 'غير محدد'}
                        ${appointment.appointmentType === 'followup' ? 
                         ` (جلسة ${appointment.followupDetails.currentSession}/${appointment.followupDetails.sessions})` : ''}
                    </div>
                </div>
            </div>
            <div class="upcoming-time">
                ${formatDate(appointment.dateTime)} - ${formatTime(appointment.dateTime)} 
                (بعد ${daysRemaining} يوم${daysRemaining > 1 ? 'ين' : ''})
                <div class="upcoming-actions">
                    <button class="complete-btn" data-id="${appointment.id}">
                        <i class="fas fa-check"></i> تم
                    </button>
                    <button class="reschedule-btn" data-id="${appointment.id}">
                        <i class="fas fa-calendar-alt"></i> تأجيل
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(item);
        
        item.querySelector('.complete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            await updateAppointmentStatus(appointment.id, 'completed');
            showAlert('success', 'تم إتمام الموعد بنجاح');
            renderDashboardUpcoming();
        });
        
        item.querySelector('.reschedule-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            rescheduleAppointment(appointment);
        });
        
        item.addEventListener('click', () => {
            showAppointmentDetails(appointment);
        });
    });
}

function renderDashboardPopularServices() {
    const container = document.getElementById('dashboardPopularServices');
    if (!container) return;
    
    const serviceCounts = {};
    const totalAppointments = appointments.filter(a => a.status !== 'cancelled').length;
    
    appointments.forEach(appointment => {
        if (appointment.serviceType && appointment.status !== 'cancelled') {
            serviceCounts[appointment.serviceType] = (serviceCounts[appointment.serviceType] || 0) + 1;
        }
    });
    
    const popularServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (popularServices.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--light-text);">لا توجد بيانات عن الجلسات</p>';
        return;
    }
    
    container.innerHTML = '';
    
    popularServices.forEach(([service, count], index) => {
        const percentage = totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0;
        const item = document.createElement('div');
        item.className = 'service-item';
        item.innerHTML = `
            <div class="service-rank">${index + 1}</div>
            <div class="service-info">
                <div class="service-name">
                    <i class="fas ${getServiceIcon(service)}"></i>
                    ${service}
                </div>
                <div class="service-progress">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="service-stats">
                <div class="service-count">${count}</div>
                <div class="service-percentage">${percentage}%</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderPopularServices() {
    const container = document.getElementById('popularServices');
    if (!container) return;
    
    const serviceCounts = {};
    const totalAppointments = appointments.filter(a => a.status !== 'cancelled').length;
    
    appointments.forEach(appointment => {
        if (appointment.serviceType && appointment.status !== 'cancelled') {
            serviceCounts[appointment.serviceType] = (serviceCounts[appointment.serviceType] || 0) + 1;
        }
    });
    
    const popularServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1]);
    
    if (popularServices.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد بيانات عن الجلسات</p>';
        return;
    }
    
    container.innerHTML = '';
    
    popularServices.forEach(([service, count], index) => {
        const percentage = totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0;
        const item = document.createElement('div');
        item.className = 'service-item';
        item.innerHTML = `
            <div class="service-rank">${index + 1}</div>
            <div class="service-info">
                <div class="service-name">
                    <i class="fas ${getServiceIcon(service)}"></i>
                    ${service}
                </div>
                <div class="service-progress">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="service-stats">
                <div class="service-count">${count}</div>
                <div class="service-percentage">${percentage}%</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Chart functions
function initRevenueChart() {
    const ctx = document.getElementById('revenueChartCanvas');
    if (!ctx) return;
    
    if (!ctx.getContext) {
        ctx.innerHTML = '<canvas></canvas>';
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    const weekLabels = [];
    
    for (let i = 0; i < weeksInMonth; i++) {
        const startDay = i * 7 + 1;
        let endDay = (i + 1) * 7;
        if (endDay > daysInMonth) endDay = daysInMonth;
        weekLabels.push(`الأسبوع ${i + 1} (${startDay}-${endDay})`);
    }
    
    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekLabels,
            datasets: [{
                label: 'الإيرادات الأسبوعية',
                data: new Array(weeksInMonth).fill(0),
                backgroundColor: 'rgba(0, 168, 132, 0.7)',
                borderColor: 'rgba(0, 168, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    rtl: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
    
    updateRevenueChart();
}

function updateRevenueChart() {
    if (!revenueChart) return;
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    
    const weeklyRevenue = new Array(weeksInMonth).fill(0);
    
    appointments.forEach(appointment => {
        if (appointment.dateTime >= monthStart.getTime() && appointment.status !== 'cancelled') {
            const appointmentDate = new Date(appointment.dateTime);
            const dayOfMonth = appointmentDate.getDate();
            const weekOfMonth = Math.floor((dayOfMonth - 1) / 7);
            
            if (weekOfMonth >= 0 && weekOfMonth < weeksInMonth) {
                weeklyRevenue[weekOfMonth] += appointment.totalPrice || 0;
            }
        }
    });
    
    revenueChart.data.datasets[0].data = weeklyRevenue;
    revenueChart.update();
}

// Appointment functions
function renderAppointments(filteredAppointments = null) {
    const container = document.getElementById('appointmentsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>جاري تحميل المواعيد...</p></div>';
    
    setTimeout(() => {
        const filterValue = document.getElementById('appointmentFilter').value;
        const searchTerm = document.getElementById('appointmentSearch').value.toLowerCase();
        
        let appointmentsToRender = filteredAppointments || appointments;
        
        if (filterValue !== 'all') {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            
            if (filterValue === 'today') {
                appointmentsToRender = appointmentsToRender.filter(a => 
                    a.dateTime >= todayStart && a.dateTime < todayStart + 86400000 && a.status !== 'cancelled');
            } else if (filterValue === 'week') {
                appointmentsToRender = appointmentsToRender.filter(a => 
                    a.dateTime >= weekStart && a.status !== 'cancelled');
            } else if (filterValue === 'month') {
                appointmentsToRender = appointmentsToRender.filter(a => 
                    a.dateTime >= monthStart && a.status !== 'cancelled');
            } else if (filterValue === 'upcoming') {
                appointmentsToRender = appointmentsToRender.filter(a => 
                    a.dateTime >= now.getTime() && a.status !== 'cancelled');
            } else if (filterValue === 'past') {
                appointmentsToRender = appointmentsToRender.filter(a => 
                    a.dateTime < now.getTime() && a.status !== 'cancelled');
            } else if (filterValue === 'followup') {
                appointmentsToRender = appointmentsToRender.filter(a => 
                    a.appointmentType === 'followup');
            }
        }
        
        if (searchTerm) {
            appointmentsToRender = appointmentsToRender.filter(appointment => 
                (appointment.clientName && appointment.clientName.toLowerCase().includes(searchTerm)) || 
                (appointment.clientPhone && appointment.clientPhone.includes(searchTerm)) ||
                (appointment.serviceType && appointment.serviceType.toLowerCase().includes(searchTerm))
            );
        }
        
        if (appointmentsToRender.length === 0) {
            container.innerHTML = '<p class="no-data">لا توجد مواعيد متاحة</p>';
            return;
        }
        
        appointmentsToRender.sort((a, b) => a.dateTime - b.dateTime);
        
        const fragment = document.createDocumentFragment();
        
        appointmentsToRender.forEach(appointment => {
            const card = createAppointmentCard(appointment);
            fragment.appendChild(card);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }, 50);
}

function createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className = 'appointment-card';
    card.setAttribute('data-id', appointment.id);
    
    const statusClass = appointment.status === 'completed' ? 'completed' : 
                      appointment.status === 'cancelled' ? 'cancelled' : '';
    
    const now = new Date();
    const appointmentDate = new Date(appointment.dateTime);
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    let daysRemainingHtml = '';
    if (daysRemaining > 0 && appointment.status === 'confirmed') {
        daysRemainingHtml = `<div class="days-remaining">${daysRemaining} يوم${daysRemaining > 1 ? 'ين' : ''}</div>`;
    }
    
    card.innerHTML = `
        ${daysRemainingHtml}
        <div class="client-info">
            <div>
                <div class="client-name">${appointment.clientName || 'غير معروف'}</div>
                <div class="client-phone">${appointment.clientPhone || 'غير متوفر'}</div>
            </div>
            <div class="appointment-date ${statusClass}">${formatTime(appointment.dateTime)}</div>
        </div>
        
        <div class="session-info">
            <div class="session-type">
                <i class="fas ${getServiceIcon(appointment.serviceType)}"></i>
                ${appointment.serviceType || 'غير محدد'}
                ${appointment.appointmentType === 'followup' ? 
                 ` (جلسة ${appointment.followupDetails.currentSession}/${appointment.followupDetails.sessions})` : ''}
            </div>
            <div class="session-desc">${appointment.notes || 'لا توجد ملاحظات'}</div>
        </div>
        
        <div class="price-info">
            <div class="price-item">
                <div class="price-label">السعر</div>
                <div class="price-value">${formatCurrency(appointment.totalPrice || 0)}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="price-item">
                <div class="price-label">المبلغ المدفوع</div>
                <div class="price-value">${formatCurrency(appointment.paidAmount || 0)}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="price-item">
                <div class="price-label">المتبقي</div>
                <div class="price-value remaining-price">${formatCurrency((appointment.totalPrice || 0) - (appointment.paidAmount || 0))}</div>
            </div>
        </div>
        
        <button class="send-reminder-btn" data-id="${appointment.id}">
            <i class="fab fa-whatsapp"></i> إرسال تذكير
        </button>
    `;
    
    card.addEventListener('click', () => {
        showAppointmentDetails(appointment);
    });
    
    card.querySelector('.send-reminder-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showMessageOptions(appointment);
    });
    
    return card;
}

// Client functions
function renderClients(filteredClients = null) {
    const container = document.getElementById('clientsContainer');
    const filterValue = document.getElementById('clientFilter').value;
    const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
    
    let clientsToRender = filteredClients || clients;
    
    if (filterValue !== 'all') {
        const now = new Date();
        const thirtyDaysAgo = now.getTime() - (30 * 86400000);
        
        if (filterValue === 'new') {
            clientsToRender = clientsToRender.filter(c => c.createdAt >= thirtyDaysAgo);
        } else if (filterValue === 'regular') {
            clientsToRender = clientsToRender.filter(c => c.appointmentsCount > 3);
        } else if (filterValue === 'noShow') {
            const noShowClients = [];
            clientsToRender.forEach(client => {
                const clientAppointments = appointments.filter(a => a.clientPhone === client.phone);
                if (clientAppointments.some(a => a.status === 'cancelled' || a.status === 'no-show')) {
                    noShowClients.push(client);
                }
            });
            clientsToRender = noShowClients;
        }
    }
    
    if (searchTerm) {
        clientsToRender = clientsToRender.filter(client => 
            (client.name && client.name.toLowerCase().includes(searchTerm)) || 
            (client.phone && client.phone.includes(searchTerm))
        );
    }
    
    if (!container) return;
    
    if (clientsToRender.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد عملاء مسجلين</p>';
        return;
    }
    
    clientsToRender.sort((a, b) => (b.lastAppointment || 0) - (a.lastAppointment || 0));
    
    container.innerHTML = '';
    
    clientsToRender.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.setAttribute('data-id', client.id);
        card.innerHTML = `
            <div class="client-avatar">${client.name ? client.name.charAt(0) : '?'}</div>
            <div class="client-details">
                <div class="client-name">${client.name || 'غير معروف'}</div>
                <div class="client-meta">
                    <div class="client-meta-item">
                        <i class="fas fa-phone"></i>
                        ${client.phone || 'غير متوفر'}
                    </div>
                    <div class="client-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        ${client.appointmentsCount || 0} مواعيد
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
        
        card.addEventListener('click', () => {
            showClientDetails(client);
        });
    });
}

// Statistics functions
function renderStatistics() {
    if (document.getElementById('monthlyProfit')) {
        document.getElementById('monthlyProfit').textContent = formatCurrency(statistics.monthlyProfit || 0);
    }
    if (document.getElementById('receivedProfit')) {
        document.getElementById('receivedProfit').textContent = formatCurrency(statistics.receivedProfit || 0);
    }
    if (document.getElementById('remainingProfit')) {
        document.getElementById('remainingProfit').textContent = formatCurrency(statistics.remainingProfit || 0);
    }
    if (document.getElementById('clientsCount')) {
        document.getElementById('clientsCount').textContent = statistics.clientsCount || 0;
    }
    if (document.getElementById('appointmentsCount')) {
        document.getElementById('appointmentsCount').textContent = statistics.appointmentsCount || 0;
    }
    if (document.getElementById('attendanceRate')) {
        document.getElementById('attendanceRate').textContent = (statistics.attendanceRate || 0) + '%';
    }
}

// Deleted items functions
function renderDeletedItems() {
    const container = document.getElementById('deletedContainer');
    const filterValue = document.getElementById('deletedFilter').value;
    
    if (!container) return;
    
    let itemsToRender = deletedItems;
    
    if (filterValue !== 'all') {
        itemsToRender = deletedItems.filter(item => item.type === filterValue);
    }
    
    if (itemsToRender.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد عناصر محذوفة</p>';
        return;
    }
    
    container.innerHTML = '';
    
    itemsToRender.forEach(item => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        
        let content = '';
        if (item.type === 'appointments') {
            content = `
                <div class="client-info">
                    <div>
                        <div class="client-name">${item.data.clientName || 'غير معروف'}</div>
                        <div class="client-phone">${item.data.clientPhone || 'غير متوفر'}</div>
                    </div>
                    <div class="appointment-date">${formatDate(item.data.dateTime)}</div>
                </div>
                
                <div class="session-info">
                    <div class="session-type">
                        <i class="fas ${getServiceIcon(item.data.serviceType)}"></i>
                        ${item.data.serviceType || 'غير محدد'}
                    </div>
                    <div class="session-desc">${item.data.notes || 'لا توجد ملاحظات'}</div>
                </div>
                
                <div class="price-info">
                    <div class="price-item">
                        <div class="price-label">السعر</div>
                        <div class="price-value">${formatCurrency(item.data.totalPrice || 0)}</div>
                    </div>
                </div>
                
                <div class="deleted-date">
                    تم الحذف في: ${formatDate(item.deletedAt)}
                </div>
            `;
        } else if (item.type === 'clients') {
            content = `
                <div class="client-info">
                    <div class="client-avatar">${item.data.name ? item.data.name.charAt(0) : '?'}</div>
                    <div>
                        <div class="client-name">${item.data.name || 'غير معروف'}</div>
                        <div class="client-phone">${item.data.phone || 'غير متوفر'}</div>
                    </div>
                </div>
                
                <div class="client-meta">
                    <div class="client-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        ${item.data.appointmentsCount || 0} مواعيد
                    </div>
                </div>
                
                <div class="deleted-date">
                    تم الحذف في: ${formatDate(item.deletedAt)}
                </div>
            `;
        }
        
        card.innerHTML = content + `
            <div class="form-actions">
                <button type="button" class="btn btn-success restore-btn" data-id="${item.id}" data-type="${item.type}">
                    <i class="fas fa-undo"></i> استعادة
                </button>
                <button type="button" class="btn btn-danger delete-permanently-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> حذف نهائي
                </button>
            </div>
        `;
        
        container.appendChild(card);
        
        // إضافة مستمعات الأحداث للأزرار
        card.querySelector('.restore-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const type = this.getAttribute('data-type');
            restoreItem(id, type);
        });
        
        card.querySelector('.delete-permanently-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deletePermanently(id);
        });
    });
}

// Custom services functions
function updateServiceDropdown() {
    const dropdown = document.getElementById('serviceType');
    if (!dropdown) return;
    
    // حفظ القيمة المحددة حالياً
    const currentValue = dropdown.value;
    
    // مسح الخيارات الحالية (مع الاحتفاظ بالخيارات الأساسية)
    while (dropdown.options.length > 13) { // 13 هو عدد الخيارات الأساسية
        dropdown.remove(12); // إزالة الخيارات المخصصة
    }
    
    // إضافة الخدمات المخصصة
    customServices.forEach(service => {
        const option = document.createElement('option');
        option.value = service.name;
        option.textContent = service.name;
        dropdown.appendChild(option);
    });
    
    // استعادة القيمة المحددة إذا كانت لا تزال موجودة
    if (currentValue && Array.from(dropdown.options).some(opt => opt.value === currentValue)) {
        dropdown.value = currentValue;
    }
}

async function addCustomService(serviceName) {
    try {
        if (!serviceName.trim()) {
            showAlert('error', 'الرجاء إدخال اسم الخدمة');
            return;
        }
        
        const servicesRef = database.ref('customServices');
        await servicesRef.push({
            name: serviceName,
            createdAt: new Date().getTime()
        });
        
        showAlert('success', 'تم إضافة الخدمة بنجاح');
        document.getElementById('addServiceModal').style.display = 'none';
        document.getElementById('serviceName').value = '';
    } catch (error) {
        console.error("Error adding service:", error);
        showAlert('error', 'حدث خطأ أثناء إضافة الخدمة');
    }
}

// Reminder functions
function checkForReminders() {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    appointments.forEach(appointment => {
        if (appointment.status !== 'confirmed') return;
        
        const appointmentDate = new Date(appointment.dateTime);
        
        // تذكير قبل 3 أيام
        if (appointmentDate >= threeDaysLater && 
            appointmentDate < new Date(threeDaysLater.getTime() + 24 * 60 * 60 * 1000)) {
            showNotification(`تذكير: موعد مع ${appointment.clientName} بعد 3 أيام`);
        }
        
        // تذكير قبل يوم
        if (appointmentDate >= tomorrow && 
            appointmentDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
            showNotification(`تذكير: موعد مع ${appointment.clientName} غداً`);
        }
    });
}

function showNotification(message) {
    if (!("Notification" in window)) {
        console.log("هذا المتصفح لا يدعم الإشعارات");
        return;
    }
    
    if (Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}

// Message functions
function showMessageOptions(appointment) {
    const modal = document.getElementById('messageOptionsModal');
    const modalContent = document.getElementById('messageOptionsContent');
    
    const now = new Date();
    const appointmentDate = new Date(appointment.dateTime);
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    const serviceMessage = serviceMessages[appointment.serviceType] || serviceMessages["أخرى"];
    
    const regularMessage = `مرحباً ${appointment.clientName || 'عميلنا العزيز'}،\n\n` +
        `هذا تذكير بموعدك القادم في عيادتنا:\n\n` +
        `📅 التاريخ: ${formatDate(appointment.dateTime)}\n` +
        `⏰ الوقت: ${formatTime(appointment.dateTime)}\n` +
        `💆‍♀️ الخدمة: ${appointment.serviceType || 'غير محدد'}\n\n` +
        (daysRemaining > 0 ? 
            `⏳ المتبقي للموعد: ${daysRemaining} يوم${daysRemaining > 1 ? 'ين' : ''}\n\n` : 
            `⏳ الموعد اليوم في ${formatTime(appointment.dateTime)}\n\n`) +
        `📍 العنوان: بغداد - الصالحية - مجمع 28 نيسان\n` +
        `📞 للاستفسار: 07510880416\n\n` +
        `نشكرك على ثقتك بنا ونتمنى رؤيتك في الموعد المحدد.`;
    
    const aiMessage = `✨ ${serviceMessage.title} ✨\n\n` +
        `${serviceMessage.message}\n\n` +
        `📅 التاريخ: ${formatDate(appointment.dateTime)}\n` +
        `⏰ الوقت: ${formatTime(appointment.dateTime)}\n` +
        (daysRemaining > 0 ? 
            `⏳ المتبقي: ${daysRemaining} يوم${daysRemaining > 1 ? 'ين' : ''}\n\n` : 
            `⏳ الموعد اليوم\n\n`) +
        `📍 العنوان: بغداد - الصالحية - مجمع 28 نيسان\n` +
        `📞 للاستفسار: 07510880416\n\n` +
        `نشكرك على ثقتك بنا 💖`;
    
    modalContent.innerHTML = `
        <div class="message-options">
            <button class="message-option-btn btn-whatsapp" onclick="prepareMessage('${encodeURIComponent(regularMessage)}', '${appointment.clientPhone}', 'regular')">
                <i class="fab fa-whatsapp"></i> إرسال الرسالة المعتادة
            </button>
            
            <button class="message-option-btn btn-ai" onclick="prepareMessage('${encodeURIComponent(aiMessage)}', '${appointment.clientPhone}', 'ai')">
                <i class="fas fa-robot"></i> إرسال رسالة ذكية
            </button>
            
            <button class="message-option-btn btn-call" onclick="makePhoneCall('${appointment.clientPhone}')">
                <i class="fas fa-phone"></i> اتصال مباشر
            </button>
        </div>
        
        <div class="message-preview">
            <strong>معاينة الرسالة الذكية:</strong>\n${aiMessage}
        </div>
    `;
    
    modal.style.display = 'flex';
}

// دالة جديدة لإعداد الرسالة للتعديل قبل الإرسال
function prepareMessage(message, phoneNumber, messageType) {
    // فك تشفير الرسالة
    const decodedMessage = decodeURIComponent(message);
    
    // تخزين بيانات الرسالة الحالية
    currentMessageData = {
        message: decodedMessage,
        phone: phoneNumber,
        type: messageType
    };
    
    // تعبئة نص الرسالة في محرر الرسائل
    document.getElementById('messageText').value = decodedMessage;
    
    // إغلاق نافذة الخيارات وفتح نافذة التعديل
    document.getElementById('messageOptionsModal').style.display = 'none';
    document.getElementById('editMessageModal').style.display = 'flex';
}

// دالة جديدة لإرسال الرسالة بعد التعديل
function sendEditedMessage() {
    if (!currentMessageData) return;
    
    const editedMessage = document.getElementById('messageText').value;
    
    if (!editedMessage.trim()) {
        showAlert('error', 'الرجاء إدخال نص الرسالة');
        return;
    }
    
    // تنظيف رقم الهاتف وإضافة مفتاح الدولة
    let cleanPhone = currentMessageData.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '964' + cleanPhone.substring(1);
    }
    
    const encodedMessage = encodeURIComponent(editedMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    
    // إغلاق نافذة التعديل
    document.getElementById('editMessageModal').style.display = 'none';
    
    showAlert('success', 'تم فتح واتساب مع الرسالة المحررة');
}

function sendWhatsAppMessage(message, phoneNumber) {
    if (!phoneNumber) {
        showAlert('error', 'لا يوجد رقم هاتف مسجل لهذا الموعد');
        return;
    }
    
    // تنظيف رقم الهاتف وإضافة مفتاح الدولة
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '964' + cleanPhone.substring(1);
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    
    // إغلاق نافذة الخيارات بعد الإرسال
    document.getElementById('messageOptionsModal').style.display = 'none';
}

function makePhoneCall(phoneNumber) {
    if (!phoneNumber) {
        showAlert('error', 'لا يوجد رقم هاتف مسجل لهذا الموعد');
        return;
    }
    
    // تنظيف رقم الهاتف
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '+964' + cleanPhone.substring(1);
    }
    
    window.open(`tel:${cleanPhone}`, '_self');
}

// Print functions
function openPrintOptions(appointment) {
    currentPrintAppointment = appointment;
    document.getElementById('printOptionsModal').style.display = 'flex';
}

function printAppointment() {
    if (!currentPrintAppointment) return;
    
    const printWindow = window.open('', '_blank');
    const includeName = document.getElementById('printClientName').checked;
    const includePhone = document.getElementById('printPhone').checked;
    const includeDate = document.getElementById('printDate').checked;
    const includeService = document.getElementById('printService').checked;
    const includePrice = document.getElementById('printPrice').checked;
    const includePaid = document.getElementById('printPaid').checked;
    const includeRemaining = document.getElementById('printRemaining').checked;
    const includeNotes = document.getElementById('printNotes').checked;
    const includeHistory = document.getElementById('printHistory').checked;
    
    let content = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تفاصيل الموعد - ${currentPrintAppointment.clientName}</title>
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .section { margin-bottom: 15px; }
                .section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                .detail-row { display: flex; margin-bottom: 8px; }
                .detail-label { width: 120px; font-weight: bold; }
                .history-item { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1> العيادة التجميلية</h1>
                <h2>تفاصيل الموعد</h2>
            </div>
    `;
    
    if (includeName) {
        content += `<div class="detail-row"><div class="detail-label">اسم العميل:</div><div>${currentPrintAppointment.clientName || 'غير معروف'}</div></div>`;
    }
    
    if (includePhone) {
        content += `<div class="detail-row"><div class="detail-label">رقم الهاتف:</div><div>${currentPrintAppointment.clientPhone || 'غير متوفر'}</div></div>`;
    }
    
    if (includeDate) {
        content += `<div class="detail-row"><div class="detail-label">التاريخ والوقت:</div><div>${formatDate(currentPrintAppointment.dateTime)} - ${formatTime(currentPrintAppointment.dateTime)}</div></div>`;
    }
    
    if (includeService) {
        content += `<div class="detail-row"><div class="detail-label">نوع الخدمة:</div><div>${currentPrintAppointment.serviceType || 'غير محدد'}</div></div>`;
    }
    
    if (includePrice) {
        content += `<div class="detail-row"><div class="detail-label">السعر:</div><div>${formatCurrency(currentPrintAppointment.totalPrice || 0)}</div></div>`;
    }
    
    if (includePaid) {
        content += `<div class="detail-row"><div class="detail-label">المبلغ المدفوع:</div><div>${formatCurrency(currentPrintAppointment.paidAmount || 0)}</div></div>`;
    }
    
    if (includeRemaining) {
        const remaining = (currentPrintAppointment.totalPrice || 0) - (currentPrintAppointment.paidAmount || 0);
        content += `<div class="detail-row"><div class="detail-label">المبلغ المتبقي:</div><div>${formatCurrency(remaining)}</div></div>`;
    }
    
    if (includeNotes && currentPrintAppointment.notes) {
        content += `<div class="section">
            <div class="section-title">الملاحظات</div>
            <div>${currentPrintAppointment.notes}</div>
        </div>`;
    }
    
    if (includeHistory) {
        // هنا يمكن إضافة سجل المراجعات إذا كان موجوداً
        const visitHistory = appointments
            .filter(a => a.clientPhone === currentPrintAppointment.clientPhone)
            .sort((a, b) => b.dateTime - a.dateTime);
        
        if (visitHistory.length > 0) {
            content += `<div class="section">
                <div class="section-title">سجل المراجعات</div>`;
            
            visitHistory.forEach(visit => {
                content += `<div class="history-item">
                    <div><strong>${formatDate(visit.dateTime)} - ${formatTime(visit.dateTime)}</strong></div>
                    <div>${visit.serviceType} - ${formatCurrency(visit.totalPrice)}</div>
                    ${visit.notes ? `<div>${visit.notes}</div>` : ''}
                </div>`;
            });
            
            content += `</div>`;
        }
    }
    
    content += `
        </body>
        </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
}

function sendDetailsViaWhatsApp() {
    if (!currentPrintAppointment) return;
    
    const includeName = document.getElementById('printClientName').checked;
    const includePhone = document.getElementById('printPhone').checked;
    const includeDate = document.getElementById('printDate').checked;
    const includeService = document.getElementById('printService').checked;
    const includePrice = document.getElementById('printPrice').checked;
    const includePaid = document.getElementById('printPaid').checked;
    const includeRemaining = document.getElementById('printRemaining').checked;
    const includeNotes = document.getElementById('printNotes').checked;
    
    let message = "✨ تفاصيل الموعد ✨\n\n";
    
    if (includeName) {
        message += `👤 الاسم: ${currentPrintAppointment.clientName || 'غير معروف'}\n`;
    }
    
    if (includePhone) {
        message += `📞 الهاتف: ${currentPrintAppointment.clientPhone || 'غير متوفر'}\n`;
    }
    
    if (includeDate) {
        message += `📅 التاريخ: ${formatDate(currentPrintAppointment.dateTime)}\n`;
        message += `⏰ الوقت: ${formatTime(currentPrintAppointment.dateTime)}\n`;
    }
    
    if (includeService) {
        message += `💆 الخدمة: ${currentPrintAppointment.serviceType || 'غير محدد'}\n`;
    }
    
    if (includePrice) {
        message += `💰 السعر: ${formatCurrency(currentPrintAppointment.totalPrice || 0)}\n`;
    }
    
    if (includePaid) {
        message += `💵 المدفوع: ${formatCurrency(currentPrintAppointment.paidAmount || 0)}\n`;
    }
    
    if (includeRemaining) {
        const remaining = (currentPrintAppointment.totalPrice || 0) - (currentPrintAppointment.paidAmount || 0);
        message += `⚖️ المتبقي: ${formatCurrency(remaining)}\n`;
    }
    
    if (includeNotes && currentPrintAppointment.notes) {
        message += `📝 الملاحظات:\n${currentPrintAppointment.notes}\n`;
    }
    
    message += `\n📍 العنوان: بغداد - الصالحية - مجمع 28 نيسان\n`;
    message += `📞 للاستفسار: 07510880416`;
    
    // تنظيف رقم الهاتف
    let cleanPhone = currentPrintAppointment.clientPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '964' + cleanPhone.substring(1);
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    
    document.getElementById('printOptionsModal').style.display = 'none';
}

// Appointment details functions
function showAppointmentDetails(appointment) {
    const modal = document.getElementById('appointmentDetailsModal');
    const modalContent = document.getElementById('appointmentDetailsContent');
    
    const statusText = appointment.status === 'completed' ? 'مكتمل' :
                      appointment.status === 'cancelled' ? 'ملغى' :
                      appointment.status === 'no-show' ? 'متغيب' : 'مؤكد';
    
    const now = new Date();
    const appointmentDate = new Date(appointment.dateTime);
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    const visitHistory = appointments
        .filter(a => a.clientPhone === appointment.clientPhone && a.id !== appointment.id)
        .sort((a, b) => b.dateTime - a.dateTime);
    
    let historyHTML = '';
    if (visitHistory.length > 0) {
        historyHTML = '<div class="visit-history"><h4>سجل الزيارات السابقة</h4>';
        visitHistory.forEach(visit => {
            const visitStatus = visit.status === 'completed' ? 'مكتمل' :
                               visit.status === 'cancelled' ? 'ملغى' :
                               visit.status === 'no-show' ? 'متغيب' : 'مؤكد';
            
            historyHTML += `
                <div class="visit-item">
                    <div><strong>${formatDate(visit.dateTime)} - ${formatTime(visit.dateTime)}</strong> (${visitStatus})</div>
                    <div>${visit.serviceType} - ${formatCurrency(visit.totalPrice)}</div>
                    ${visit.notes ? `<div style="margin-top: 5px; color: var(--light-text);">${visit.notes}</div>` : ''}
                </div>
            `;
        });
        historyHTML += '</div>';
    }
    
    const remainingAmount = (appointment.totalPrice || 0) - (appointment.paidAmount || 0);
    let paymentSection = '';
    if (remainingAmount > 0 && appointment.status !== 'completed' && appointment.status !== 'cancelled') {
        paymentSection = `
            <div class="payment-section">
                <h4>تسديد المبلغ المتبقي: ${formatCurrency(remainingAmount)}</h4>
                <button id="payRemainingBtn" class="btn btn-primary">
                    <i class="fas fa-money-bill-wave"></i> تسديد المبلغ
                </button>
            </div>
        `;
    }
    
    let followUpButton = '';
    if (appointment.status === 'completed') {
        followUpButton = `
            <button class="follow-up-btn" id="followUpBtn">
                <i class="fas fa-calendar-plus"></i> حجز موعد متابعة
            </button>
        `;
    }
    
    modalContent.innerHTML = `
        <div class="client-info">
            <div>
                <div class="client-name">${appointment.clientName || 'غير معروف'}</div>
                <div class="client-phone">${appointment.clientPhone || 'غير متوفر'}</div>
            </div>
            <div class="appointment-date">${formatDate(appointment.dateTime)} - ${formatTime(appointment.dateTime)}</div>
        </div>
        
        <div class="session-info">
            <div class="session-type">
                <i class="fas ${getServiceIcon(appointment.serviceType)}"></i>
                ${appointment.serviceType || 'غير محدد'}
                ${appointment.appointmentType === 'followup' ? 
                 ` (جلسة ${appointment.followupDetails.currentSession}/${appointment.followupDetails.sessions})` : ''}
            </div>
            <div class="session-desc">${appointment.notes || 'لا توجد ملاحظات'}</div>
            <div class="session-status" style="margin-top: 10px;">
                <strong>الحالة:</strong> ${statusText}
            </div>
            ${daysRemaining > 0 ? `<div style="margin-top: 5px;"><strong>الأيام المتبقية:</strong> ${daysRemaining} يوم${daysRemaining > 1 ? 'ين' : ''}</div>` : ''}
        </div>
        
        <div class="price-info">
            <div class="price-item">
                <div class="price-label">السعر</div>
                <div class="price-value">${formatCurrency(appointment.totalPrice || 0)}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="price-item">
                <div class="price-label">المبلغ المدفوع</div>
                <div class="price-value">${formatCurrency(appointment.paidAmount || 0)}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="price-item">
                <div class="price-label">المتبقي</div>
                <div class="price-value remaining-price">${formatCurrency(remainingAmount)}</div>
            </div>
        </div>
        
        ${followUpButton}
        
        <button class="send-reminder-btn" style="width: 100%; margin-top: 15px;" onclick="showMessageOptions(${JSON.stringify(appointment).replace(/"/g, '&quot;')})">
            <i class="fab fa-whatsapp"></i> إرسال تذكير بالواتساب
        </button>
        
        <button class="print-btn" style="width: 100%; margin-top: 10px;" onclick="openPrintOptions(${JSON.stringify(appointment).replace(/"/g, '&quot;')})">
            <i class="fas fa-print"></i> طباعة التفاصيل
        </button>
        
        ${paymentSection}
        
        ${historyHTML}
        
        <div class="form-actions" style="margin-top: 20px;">
            <button type="button" class="btn btn-danger" id="deleteAppointmentBtn" data-id="${appointment.id}">
                <i class="fas fa-trash"></i> حذف الموعد
            </button>
            <button type="button" class="btn btn-primary" id="editAppointmentBtn" data-id="${appointment.id}">
                <i class="fas fa-edit"></i> تعديل الموعد
            </button>
            ${appointment.status !== 'completed' && appointment.status !== 'cancelled' ? `
            <button type="button" class="btn btn-success" id="completeAppointmentBtn" data-id="${appointment.id}">
                <i class="fas fa-check"></i> إتمام الموعد
            </button>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
    
    document.getElementById('editAppointmentBtn')?.addEventListener('click', () => {
        editAppointment(appointment.id);
        modal.style.display = 'none';
    });
    
    document.getElementById('completeAppointmentBtn')?.addEventListener('click', async () => {
        const notes = prompt('أدخل ملاحظات الزيارة:');
        if (notes !== null) {
            try {
                await updateAppointmentStatus(appointment.id, 'completed');
                await updateAppointment(appointment.id, {
                    ...appointment,
                    notes: appointment.notes ? `${appointment.notes}\n\nملاحظات الزيارة: ${notes}` : notes
                });
                showAlert('success', 'تم تحديث حالة الموعد بنجاح');
                modal.style.display = 'none';
            } catch (error) {
                showAlert('error', 'حدث خطأ أثناء تحديث الموعد');
            }
        }
    });
    
    document.getElementById('deleteAppointmentBtn')?.addEventListener('click', async () => {
        showConfirmation('هل أنت متأكد من حذف هذا الموعد؟', async () => {
            try {
                await deleteAppointment(appointment.id);
                showAlert('success', 'تم نقل الموعد إلى المحذوفات');
                modal.style.display = 'none';
            } catch (error) {
                showAlert('error', 'حدث خطأ أثناء حذف الموعد');
            }
        });
    });
    
    document.getElementById('payRemainingBtn')?.addEventListener('click', async () => {
        const amount = parseFloat(prompt(`المبلغ المتبقي: ${formatCurrency(remainingAmount)}\n\nأدخل المبلغ المدفوع:`));
        if (amount && amount > 0 && amount <= remainingAmount) {
            const success = await payRemainingAmount(appointment.id, amount);
            if (success) {
                showAppointmentDetails({...appointment, paidAmount: (appointment.paidAmount || 0) + amount});
            }
        } else {
            showAlert('error', 'المبلغ غير صحيح');
        }
    });
}

// Client details functions
function showClientDetails(client) {
    const modal = document.getElementById('clientModal');
    const modalContent = document.getElementById('clientModalContent');
    
    modalContent.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div class="client-avatar" style="width: 70px; height: 70px; font-size: 28px;">
                ${client.name ? client.name.charAt(0) : '?'}
            </div>
            <div style="margin-right: 15px;">
                <h3 style="margin-bottom: 5px;">${client.name || 'غير معروف'}</h3>
                <p style="color: var(--light-text);">${client.phone || 'غير متوفر'}</p>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h4 style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px;">
                <i class="fas fa-info-circle" style="margin-left: 8px;"></i>
                المعلومات الأساسية
            </h4>
            
            <p><strong>عدد المواعيد:</strong> ${client.appointmentsCount || 0}</p>
            <p><strong>تاريخ التسجيل:</strong> ${client.createdAt ? formatDate(client.createdAt) : 'غير معروف'}</p>
            <p><strong>آخر زيارة:</strong> ${client.lastAppointment ? formatDate(client.lastAppointment) : 'لا يوجد'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h4 style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px;">
                <i class="fas fa-calendar-alt" style="margin-left: 8px;"></i>
                آخر المواعيد
            </h4>
            ${getClientLastAppointments(client.id)}
        </div>
        
        <div class="form-actions" style="margin-top: 20px;">
            <button type="button" class="btn btn-danger" id="deleteClientBtn" data-id="${client.id}">
                <i class="fas fa-trash"></i> حذف العميل
            </button>
            <button type="button" class="btn btn-primary" id="editClientBtn" data-id="${client.id}">
                <i class="fas fa-edit"></i> تعديل العميل
            </button>
            <button type="button" class="btn btn-success" id="addAppointmentForClientBtn" data-id="${client.id}">
                <i class="fas fa-calendar-plus"></i> إضافة موعد
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    document.getElementById('editClientBtn')?.addEventListener('click', () => {
        editClient(client.id);
        modal.style.display = 'none';
    });
    
    document.getElementById('addAppointmentForClientBtn')?.addEventListener('click', () => {
        addAppointmentForClient(client);
        modal.style.display = 'none';
    });
    
    document.getElementById('deleteClientBtn')?.addEventListener('click', async () => {
        showConfirmation('هل أنت متأكد من حذف هذا العميل؟', async () => {
            try {
                await deleteClient(client.id);
                showAlert('success', 'تم نقل العميل إلى المحذوفات');
                modal.style.display = 'none';
            } catch (error) {
                showAlert('error', 'حدث خطأ أثناء حذف العميل');
            }
        });
    });
}

function getClientLastAppointments(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return '<p>لا توجد بيانات للعميل</p>';
    
    const clientAppointments = appointments.filter(a => a.clientPhone === client.phone)
        .sort((a, b) => b.dateTime - a.dateTime)
        .slice(0, 3);
    
    if (clientAppointments.length === 0) {
        return '<p>لا توجد مواعيد سابقة</p>';
    }
    
    let html = '';
    clientAppointments.forEach(app => {
        const visitStatus = app.status === 'completed' ? 'مكتمل' :
                          app.status === 'cancelled' ? 'ملغى' :
                          app.status === 'no-show' ? 'متغيب' : 'مؤكد';
        
        html += `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #eee;">
                <p><strong>${formatDate(app.dateTime)} - ${formatTime(app.dateTime)}</strong> (${visitStatus})</p>
                <p>${app.serviceType} - ${formatCurrency(app.totalPrice)}</p>
                ${app.notes ? `<p style="margin-top: 5px; color: var(--light-text);">${app.notes}</p>` : ''}
            </div>
        `;
    });
    
    return html;
}

// CRUD operations
async function addAppointment(appointmentData) {
    try {
        if (appointmentData.clientPhone && !appointmentData.clientPhone.startsWith('+')) {
            appointmentData.clientPhone = '+964' + appointmentData.clientPhone;
        }
        
        const appointmentsRef = database.ref('appointments');
        const newAppointmentRef = appointmentsRef.push();
        await newAppointmentRef.set({
            ...appointmentData,
            status: 'confirmed',
            createdAt: new Date().getTime()
        });
        
        // حجز مواعيد المتابعة إذا كان نوع الموعد متابعة
        if (appointmentData.appointmentType === 'followup' && appointmentData.followupDetails) {
            const followupDetails = appointmentData.followupDetails;
            
            for (let i = 1; i < followupDetails.sessions; i++) {
                const followupDate = new Date(appointmentData.dateTime + (followupDetails.interval * i * 24 * 60 * 60 * 1000));
                const followupData = {
                    ...appointmentData,
                    dateTime: followupDate.getTime(),
                    followupDetails: {
                        ...followupDetails,
                        currentSession: i + 1,
                        mainAppointmentId: newAppointmentRef.key
                    },
                    isFollowup: true
                };
                
                await appointmentsRef.push(followupData);
            }
        }
        
        await updateClientStatistics(appointmentData.clientName, appointmentData.clientPhone);
        
        return newAppointmentRef.key;
    } catch (error) {
        console.error("Error adding appointment:", error);
        throw error;
    }
}

async function updateAppointment(appointmentId, updatedData) {
    try {
        if (updatedData.clientPhone && !updatedData.clientPhone.startsWith('+')) {
            updatedData.clientPhone = '+964' + updatedData.clientPhone;
        }
        
        const appointmentRef = database.ref(`appointments/${appointmentId}`);
        await appointmentRef.update({
            ...updatedData,
            updatedAt: new Date().getTime()
        });
    } catch (error) {
        console.error("Error updating appointment:", error);
        throw error;
    }
}

async function updateAppointmentStatus(appointmentId, status) {
    try {
        const appointmentRef = database.ref(`appointments/${appointmentId}`);
        await appointmentRef.update({
            status: status,
            updatedAt: new Date().getTime()
        });
    } catch (error) {
        console.error("Error updating appointment status:", error);
        throw error;
    }
}

async function deleteAppointment(appointmentId) {
    try {
        const appointmentRef = database.ref(`appointments/${appointmentId}`);
        const snapshot = await appointmentRef.once('value');
        const appointment = snapshot.val();
        
        // إضافة إلى المحذوفات
        const deletedRef = database.ref('deletedItems');
        await deletedRef.push({
            type: 'appointments',
            data: appointment,
            deletedAt: new Date().getTime(),
            deletedBy: 'system'
        });
        
        // حذف من المواعيد
        await appointmentRef.remove();
        
        showAlert('success', 'تم نقل الموعد إلى المحذوفات');
    } catch (error) {
        console.error("Error deleting appointment:", error);
        throw error;
    }
}

async function deleteClient(clientId) {
    try {
        const clientRef = database.ref(`clients/${clientId}`);
        const snapshot = await clientRef.once('value');
        const client = snapshot.val();
        
        // إضافة إلى المحذوفات
        const deletedRef = database.ref('deletedItems');
        await deletedRef.push({
            type: 'clients',
            data: client,
            deletedAt: new Date().getTime(),
            deletedBy: 'system'
        });
        
        // حذف من العملاء
        await clientRef.remove();
        
        showAlert('success', 'تم نقل العميل إلى المحذوفات');
    } catch (error) {
        console.error("Error deleting client:", error);
        throw error;
    }
}

async function restoreItem(itemId, itemType) {
    try {
        const itemRef = database.ref(`deletedItems/${itemId}`);
        const snapshot = await itemRef.once('value');
        const item = snapshot.val();
        
        if (itemType === 'appointments') {
            const appointmentsRef = database.ref('appointments');
            await appointmentsRef.push(item.data);
        } else if (itemType === 'clients') {
            const clientsRef = database.ref('clients');
            await clientsRef.push(item.data);
        }
        
        // حذف العنصر من قائمة المحذوفات
        await itemRef.remove();
        
        showAlert('success', 'تم استعادة العنصر بنجاح');
    } catch (error) {
        console.error("Error restoring item:", error);
        showAlert('error', 'حدث خطأ أثناء الاستعادة');
    }
}

async function deletePermanently(itemId) {
    try {
        const itemRef = database.ref(`deletedItems/${itemId}`);
        await itemRef.remove();
        
        showAlert('success', 'تم الحذف النهائي بنجاح');
    } catch (error) {
        console.error("Error deleting permanently:", error);
        showAlert('error', 'حدث خطأ أثناء الحذف');
    }
}

async function payRemainingAmount(appointmentId, amount) {
    try {
        const appointmentRef = database.ref(`appointments/${appointmentId}`);
        const snapshot = await appointmentRef.once('value');
        const appointment = snapshot.val();
        
        const newPayment = {
            amount: amount,
            date: new Date().getTime(),
            method: 'cash'
        };
        
        const payments = appointment.payments || [];
        payments.push(newPayment);
        
        const paidAmount = (appointment.paidAmount || 0) + amount;
        
        await appointmentRef.update({
            paidAmount: paidAmount,
            payments: payments,
            updatedAt: new Date().getTime()
        });
        
        showAlert('success', 'تم تسديد المبلغ بنجاح');
        return true;
    } catch (error) {
        console.error('Error processing payment:', error);
        showAlert('error', 'حدث خطأ أثناء تسديد المبلغ');
        return false;
    }
}

async function updateClientStatistics(clientName, clientPhone) {
    const clientsRef = database.ref('clients');
    
    const snapshot = await clientsRef.once('value');
    
    let clientExists = false;
    let clientId = null;
    
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const client = childSnapshot.val();
            if (client.phone === clientPhone) {
                clientExists = true;
                clientId = childSnapshot.key;
            }
        });
    }
    
    if (clientExists && clientId) {
        const clientRef = database.ref(`clients/${clientId}`);
        const clientSnapshot = await clientRef.once('value');
        const currentCount = clientSnapshot.val().appointmentsCount || 0;
        
        await clientRef.update({
            name: clientName,
            appointmentsCount: currentCount + 1,
            lastAppointment: new Date().getTime(),
            updatedAt: new Date().getTime()
        });
    } else {
        const newClient = {
            name: clientName,
            phone: clientPhone,
            appointmentsCount: 1,
            createdAt: new Date().getTime(),
            lastAppointment: new Date().getTime()
        };
        
        await clientsRef.push(newClient);
    }
    
    await updateGeneralStatistics();
}

async function updateGeneralStatistics() {
    const statsRef = database.ref('statistics');
    const snapshot = await statsRef.once('value');
    
    let currentStats = {};
    if (snapshot.exists()) {
        currentStats = snapshot.val();
    }
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const monthlyAppointments = appointments.filter(a => a.dateTime >= monthStart);
    const todayAppointments = appointments.filter(a => a.dateTime >= todayStart && a.dateTime < todayStart + 86400000);
    
    const monthlyRevenue = monthlyAppointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const receivedRevenue = monthlyAppointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
    
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const attendanceRate = appointments.length > 0 ? 
        Math.round((completedAppointments / appointments.length) * 100) : 0;
    
    const updatedStats = {
        monthlyProfit: monthlyRevenue,
        receivedProfit: receivedRevenue,
        remainingProfit: monthlyRevenue - receivedRevenue,
        clientsCount: clients.length,
        appointmentsCount: appointments.length,
        todayAppointmentsCount: todayAppointments.length,
        attendanceRate: attendanceRate,
        updatedAt: new Date().getTime()
    };
    
    await statsRef.update(updatedStats);
}

// Utility functions
function showConfirmation(message, callback) {
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.innerHTML = `
        <div class="confirmation-content">
            <div class="confirmation-message">${message}</div>
            <div class="confirmation-buttons">
                <button class="btn btn-secondary" id="confirmCancel">إلغاء</button>
                <button class="btn btn-danger" id="confirmOk">تأكيد</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('confirmCancel').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('confirmOk').addEventListener('click', () => {
        modal.remove();
        callback();
    });
}

function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'warning' ? 'exclamation-triangle' : 
                          'exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 5000);
}

function scheduleFollowUp(appointment) {
    const modal = document.getElementById('addModal');
    const form = document.getElementById('appointmentForm');
    
    form.reset();
    form.removeAttribute('data-id');
    
    document.getElementById('clientName').value = appointment.clientName || '';
    document.getElementById('clientPhone').value = appointment.clientPhone || '';
    document.getElementById('serviceType').value = appointment.serviceType || '';
    document.getElementById('totalPrice').value = appointment.totalPrice || '';
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.getElementById('appointmentDate').valueAsDate = nextWeek;
    
    const appointmentTime = new Date(appointment.dateTime);
    document.getElementById('appointmentTime').value = `${String(appointmentTime.getHours()).padStart(2, '0')}:${String(appointmentTime.getMinutes()).padStart(2, '0')}`;
    
    document.getElementById('notes').value = `موعد متابعة - ${appointment.notes || ''}`;
    
    document.querySelector('.modal-title').innerHTML = '<i class="fas fa-calendar-plus"></i> حجز موعد متابعة';
    modal.style.display = 'flex';
}

function rescheduleAppointment(appointment) {
    const newDate = prompt('أدخل التاريخ الجديد (YYYY-MM-DD):', formatDate(appointment.dateTime));
    const newTime = prompt('أدخل الوقت الجديد (HH:MM):', formatTime(appointment.dateTime));
    
    if (newDate && newTime) {
        try {
            const [hours, minutes] = newTime.split(':');
            const date = new Date(newDate);
            date.setHours(parseInt(hours));
            date.setMinutes(parseInt(minutes));
            
            updateAppointment(appointment.id, {
                ...appointment,
                dateTime: date.getTime()
            }).then(() => {
                showAlert('success', 'تم تأجيل الموعد بنجاح');
                renderDashboardUpcoming();
            });
        } catch (error) {
            showAlert('error', 'حدث خطأ أثناء تأجيل الموعد');
        }
    }
}

function editAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    const modal = document.getElementById('addModal');
    const form = document.getElementById('appointmentForm');
    
    document.getElementById('clientName').value = appointment.clientName || '';
    document.getElementById('clientPhone').value = appointment.clientPhone || '';
    
    if (appointment.dateTime) {
        const date = new Date(appointment.dateTime);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        document.getElementById('appointmentDate').value = dateStr;
        document.getElementById('appointmentTime').value = timeStr;
    }
    
    document.getElementById('serviceType').value = appointment.serviceType || '';
    document.getElementById('totalPrice').value = appointment.totalPrice || '';
    document.getElementById('paidAmount').value = appointment.paidAmount || '';
    document.getElementById('notes').value = appointment.notes || '';
    
    document.querySelector('.modal-title').innerHTML = '<i class="fas fa-edit"></i> تعديل الموعد';
    form.setAttribute('data-id', appointmentId);
    modal.style.display = 'flex';
}

function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    alert('سيتم تنفيذ وظيفة تعديل العميل في الإصدارات القادمة');
}

function addAppointmentForClient(client) {
    const modal = document.getElementById('addModal');
    const form = document.getElementById('appointmentForm');
    
    form.reset();
    form.removeAttribute('data-id');
    
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientPhone').value = client.phone || '';
    
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    document.getElementById('appointmentDate').valueAsDate = now;
    document.getElementById('appointmentTime').value = `${String(nextHour.getHours()).padStart(2, '0')}:${String(nextHour.getMinutes()).padStart(2, '0')}`;
    
    document.querySelector('.modal-title').innerHTML = '<i class="fas fa-calendar-plus"></i> إضافة موعد جديد';
    modal.style.display = 'flex';
}

// Formatting functions
function formatCurrency(amount) {
    if (isNaN(amount)) return '0 د.ع';
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' د.ع';
}

function formatTime(timestamp) {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
    if (!timestamp) return '--/--/----';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-IQ');
}

function getServiceIcon(serviceType) {
    const icons = {
        'جلسة علاج التصبغات': 'fa-spa',
        'جلسة العناية بالبشرة': 'fa-hand-holding-heart',
        'حقن البوتوكس': 'fa-syringe',
        'حقن الفيلر': 'fa-syringe',
        'حقن الميزوثرابي': 'fa-tint',
        'علاج تساقط الشعر': 'fa-user',
                'علاج الهالات السوداء': 'fa-eye',
        'علاج حب الشباب': 'fa-spa',
        'علاج آثار حب الشباب': 'fa-spa',
        'حقن فيلر الشفاه': 'fa-kiss-wink-heart',
        'التغيير الشامل بالفيلر': 'fa-crown',
        'أخرى': 'fa-calendar-alt'
    };
    return icons[serviceType] || 'fa-calendar-alt';
}

function getStatusColor(status) {
    const colors = {
        'confirmed': '#00a884',
        'completed': '#28a745',
        'cancelled': '#dc3545',
        'no-show': '#ffc107'
    };
    return colors[status] || '#00a884';
}

// Event listeners
function setupEventListeners() {
    // Add button
    document.getElementById('addBtn')?.addEventListener('click', () => {
        document.getElementById('appointmentForm').reset();
        document.getElementById('appointmentForm').removeAttribute('data-id');
        document.querySelector('.modal-title').innerHTML = '<i class="fas fa-calendar-plus"></i> إضافة موعد جديد';
        document.getElementById('addModal').style.display = 'flex';
        
        const today = new Date();
        const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
        document.getElementById('appointmentDate').valueAsDate = today;
        document.getElementById('appointmentTime').value = `${String(nextHour.getHours()).padStart(2, '0')}:${String(nextHour.getMinutes()).padStart(2, '0')}`;
    });
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            // إغلاق جميع النوافذ
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Appointment type change
    document.getElementById('appointmentType')?.addEventListener('change', function() {
        document.getElementById('followupDetails').style.display = 
            this.value === 'followup' ? 'block' : 'none';
    });
    
    // Appointment filter
    document.getElementById('appointmentFilter')?.addEventListener('change', function() {
        renderAppointments();
    });
    
    // Appointment search
    document.getElementById('appointmentSearch')?.addEventListener('input', function() {
        renderAppointments();
    });
    
    // Client search
    document.getElementById('clientSearch')?.addEventListener('input', function() {
        renderClients();
    });
    
    // Client filter
    document.getElementById('clientFilter')?.addEventListener('change', function() {
        renderClients();
    });
    
    // Deleted items filter
    document.getElementById('deletedFilter')?.addEventListener('change', function() {
        renderDeletedItems();
    });
    
    // Empty trash button
    document.getElementById('emptyTrashBtn')?.addEventListener('click', function() {
        showConfirmation('هل أنت متأكد من تفريغ سلة المحذوفات؟ هذا سيحذف جميع العناصر نهائياً', async () => {
            try {
                const deletedRef = database.ref('deletedItems');
                await deletedRef.remove();
                showAlert('success', 'تم تفريغ المحذوفات بنجاح');
            } catch (error) {
                console.error("Error emptying trash:", error);
                showAlert('error', 'حدث خطأ أثناء تفريغ المحذوفات');
            }
        });
    });
    
    // Stats period filter
    document.getElementById('statsPeriod')?.addEventListener('change', function() {
        showAlert('info', 'تم تغيير الفترة الزمنية للإحصائيات');
    });
    
    // Export stats
    document.getElementById('exportStatsBtn')?.addEventListener('click', function() {
        const data = [
            ['الإحصائية', 'القيمة'],
            ['إجمالي الأرباح الشهرية', statistics.monthlyProfit],
            ['الأرباح الواصلة', statistics.receivedProfit],
            ['الأرباح المتبقية', statistics.remainingProfit],
            ['عدد المراجعين', statistics.clientsCount],
            ['عدد المواعيد', statistics.appointmentsCount],
            ['نسبة الحضور', statistics.attendanceRate + '%']
        ];
        
                let csvContent = data.map(e => e.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `إحصائيات_العيادة_${new Date().toLocaleDateString('ar-IQ')}.csv`);
        link.click();
    });
    
    // Add service button
    document.getElementById('addServiceBtn')?.addEventListener('click', function() {
        document.getElementById('addServiceModal').style.display = 'flex';
    });
    
    // Save service button
    document.getElementById('saveServiceBtn')?.addEventListener('click', function() {
        const serviceName = document.getElementById('serviceName').value;
        addCustomService(serviceName);
    });
    
    // Print as paper button
    document.getElementById('printAsPaper')?.addEventListener('click', function() {
        printAppointment();
    });
    
    // Send to WhatsApp button
    document.getElementById('sendToWhatsApp')?.addEventListener('click', function() {
        sendDetailsViaWhatsApp();
    });
    
    // Send edited message button
    document.getElementById('sendEditedMessageBtn')?.addEventListener('click', sendEditedMessage);
    
    // Appointment form submission
    document.getElementById('appointmentForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitText.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> جاري الحفظ...';
        submitSpinner.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        const date = new Date(document.getElementById('appointmentDate').value);
        const time = document.getElementById('appointmentTime').value.split(':');
        date.setHours(parseInt(time[0]));
        date.setMinutes(parseInt(time[1]));
        
        const formData = {
            clientName: document.getElementById('clientName').value,
            clientPhone: document.getElementById('clientPhone').value,
            dateTime: date.getTime(),
            serviceType: document.getElementById('serviceType').value,
            totalPrice: parseFloat(document.getElementById('totalPrice').value) || 0,
            paidAmount: parseFloat(document.getElementById('paidAmount').value) || 0,
            notes: document.getElementById('notes').value,
            status: 'confirmed',
            updatedAt: new Date().getTime(),
            appointmentType: document.getElementById('appointmentType').value,
            followupDetails: document.getElementById('appointmentType').value === 'followup' ? {
                sessions: parseInt(document.getElementById('followupSessions').value) || 1,
                interval: parseInt(document.getElementById('followupInterval').value) || 7,
                currentSession: 1
            } : null
        };
        
        if (!formData.clientName || !formData.clientPhone || !formData.serviceType || isNaN(formData.totalPrice)) {
            showAlert('error', 'الرجاء ملء جميع الحقول المطلوبة بشكل صحيح');
            submitText.innerHTML = '<i class="fas fa-save"></i> حفظ الموعد';
            submitSpinner.style.display = 'none';
            submitBtn.disabled = false;
            return;
        }
        
        try {
            const appointmentId = this.getAttribute('data-id');
            
            if (appointmentId) {
                await updateAppointment(appointmentId, formData);
                showAlert('success', 'تم تحديث الموعد بنجاح');
            } else {
                formData.createdAt = new Date().getTime();
                await addAppointment(formData);
                showAlert('success', 'تم إضافة الموعد بنجاح');
            }
            
            document.getElementById('addModal').style.display = 'none';
            this.reset();
            this.removeAttribute('data-id');
            document.querySelector('.modal-title').innerHTML = '<i class="fas fa-calendar-plus"></i> إضافة موعد جديد';
        } catch (error) {
            console.error('Error saving appointment:', error);
            showAlert('error', 'حدث خطأ أثناء حفظ الموعد: ' + error.message);
        } finally {
            submitText.innerHTML = '<i class="fas fa-save"></i> حفظ الموعد';
            submitSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
    
    // Tab switching
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.content-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'statistics') {
                initRevenueChart();
            }
            
            if (tabId === 'dashboard') {
                renderDashboard();
            }
        });
    });
    
    // Bottom navigation
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.bottom-nav .nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            document.querySelector(`.content-tab[data-tab="${tabId}"]`).click();
        });
    });
    
    // Dashboard links
    document.querySelectorAll('.dashboard-section-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            document.querySelector(`.content-tab[data-tab="${tabId}"]`).click();
        });
    });
    
    // Search button
    document.getElementById('searchBtn')?.addEventListener('click', function() {
        const searchTerm = prompt('أدخل كلمة البحث:');
        if (searchTerm) {
            document.getElementById('appointmentSearch').value = searchTerm;
            document.getElementById('appointmentSearch').dispatchEvent(new Event('input'));
        }
    });
    
    // Notifications button
    document.getElementById('notificationsBtn')?.addEventListener('click', function() {
        alert('قائمة الإشعارات ستعرض هنا في الإصدارات القادمة');
    });
    
    // Phone click handlers
    setupPhoneClickHandlers();
}

function setupPhoneClickHandlers() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('client-phone') || 
            (e.target.parentElement && e.target.parentElement.classList.contains('client-phone'))) {
            e.preventDefault();
            const phoneElement = e.target.classList.contains('client-phone') ? e.target : e.target.parentElement;
            let phoneNumber = phoneElement.textContent.trim();
            
            if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+964' + phoneNumber.replace(/^0/, '');
            }
            
            const appointment = appointments.find(a => a.clientPhone === phoneNumber || 
                                                      a.clientPhone === phoneNumber.replace('+964', '') ||
                                                      a.clientPhone === '0' + phoneNumber.replace('+964', ''));
            if (appointment) {
                showMessageOptions(appointment);
            } else {
                window.open(`https://wa.me/${phoneNumber}`, '_blank');
            }
        }
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    
    // Auto-login for development
    if (window.location.href.includes('localhost')) {
        document.getElementById('loginUsername').value = 'yehia';
        document.getElementById('loginPassword').value = '1111';
    }
});
// متغير لتخزين event التثبيت
let deferredPrompt;

// التحقق من دعم متصفح المستخدم للتثبيت
function checkPWAInstallSupport() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone) {
        console.log('التطبيق مثبت بالفعل');
        return false;
    }
    
    if (!('BeforeInstallPromptEvent' in window)) {
        console.log('المتصفح لا يدعم تثبيت PWA');
        return false;
    }
    
    return true;
}

// عرض نافذة التثبيت
function showInstallPrompt() {
    const hideInstallPrompt = localStorage.getItem('hideInstallPrompt');
    const installPromptShown = localStorage.getItem('installPromptShown');
    
    if (hideInstallPrompt || installPromptShown) {
        return;
    }
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        document.body.classList.add('ios');
    }
    
    setTimeout(() => {
        const installModal = document.getElementById('installPromptModal');
        if (installModal) {
            installModal.style.display = 'flex';
            localStorage.setItem('installPromptShown', 'true');
        }
    }, 3000);
}

// إخفاء نافذة التثبيت
function hideInstallPrompt() {
    const installModal = document.getElementById('installPromptModal');
    if (installModal) {
        installModal.style.display = 'none';
    }
}

// إعداد event listeners للتثبيت
function setupInstallPrompt() {
    if (!checkPWAInstallSupport()) return;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('وافق المستخدم على تثبيت التطبيق');
            } else {
                console.log('رفض المستخدم تثبيت التطبيق');
            }
            
            deferredPrompt = null;
            hideInstallPrompt();
        });
    }
    
    const laterBtn = document.getElementById('laterInstallBtn');
    if (laterBtn) {
        laterBtn.addEventListener('click', () => {
            hideInstallPrompt();
        });
    }
    
    const closeBtn = document.getElementById('closeInstallPrompt');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideInstallPrompt();
            localStorage.setItem('hideInstallPrompt', 'true');
        });
    }
}

// في نهاية app.js، بعد كل الدوال الأخرى
// إضافة زر المصروفات إلى واجهة المستخدم
function addExpensesButton() {
    // البحث عن عنصر الإجراءات في الهيدر
    const headerIcons = document.querySelector('.header-icons');
    
    if (headerIcons) {
        // إنشاء زر المصروفات
        const expensesIcon = document.createElement('div');
        expensesIcon.className = 'header-icon';
        expensesIcon.id = 'expensesBtn';
        expensesIcon.innerHTML = '<i class="fas fa-money-bill"></i>';
        
        // إضافة الزر قبل زر الخروج
        headerIcons.insertBefore(expensesIcon, headerIcons.querySelector('#logoutBtn'));
        
        // إضافة مستمع الأحداث
        expensesIcon.addEventListener('click', function() {
            window.location.href = 'expense.html';
        });
    }
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // ... الكود الحالي ...
    
    // إضافة زر المصروفات بعد تحميل الصفحة
    setTimeout(addExpensesButton, 1000);
});

// دالة لتحديث لوحة التحكم مع مراعاة المصروفات
async function updateDashboard() {
    try {
        const statsRef = database.ref('statistics');
        const snapshot = await statsRef.once('value');
        
        if (snapshot.exists()) {
            const statistics = snapshot.val();
            
            // تحديث قيمة الأرباح الواصلة في لوحة التحكم
            if (document.getElementById('dashboardMonthlyProfit')) {
                document.getElementById('dashboardMonthlyProfit').textContent = 
                    formatCurrency(statistics.receivedProfit || 0);
            }
        }
    } catch (error) {
        console.error("Error updating dashboard:", error);
    }
}

// دالة لتحديث لوحة التحكم مع مراعاة المصروفات
async function updateDashboard() {
    try {
        const statsRef = database.ref('statistics');
        const snapshot = await statsRef.once('value');
        
        if (snapshot.exists()) {
            const statistics = snapshot.val();
            
            // تحديث قيمة الأرباح الواصلة في لوحة التحكم
            if (document.getElementById('dashboardMonthlyProfit')) {
                document.getElementById('dashboardMonthlyProfit').textContent = 
                    formatCurrency(statistics.receivedProfit || 0);
            }
        }
    } catch (error) {
        console.error("Error updating dashboard:", error);
    }
}

// استدعاء الدالة عند تحميل الصفحة وتحديث البيانات
document.addEventListener('DOMContentLoaded', function() {
    // تحديث لوحة التحكم عند تحميل البيانات
    loadAllData().then(() => {
        updateDashboard();
    });
    
    // تحديث لوحة التحكم عند أي تغيير في البيانات
    database.ref('statistics').on('value', function(snapshot) {
        updateDashboard();
    });
});