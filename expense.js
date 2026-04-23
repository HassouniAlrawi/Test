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
let expenses = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadExpenses();
            setupEventListeners();
            setCurrentDate();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
        }
    });
});

// Set current date as default for expense date
function setCurrentDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('expenseDate').value = formattedDate;
}

// Load expenses from Firebase
function loadExpenses() {
    try {
        const expensesRef = database.ref('expenses');
        expensesRef.on('value', (snapshot) => {
            expenses = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const expense = childSnapshot.val();
                    expense.id = childSnapshot.key;
                    expenses.push(expense);
                });
            }
            renderExpenses();
            updateExpensesSummary();
        });
    } catch (error) {
        console.error("Error loading expenses:", error);
        showAlert('error', 'حدث خطأ أثناء تحميل المصروفات');
    }
}

// Add new expense
async function addExpense(expenseData) {
    try {
        const expensesRef = database.ref('expenses');
        await expensesRef.push({
            ...expenseData,
            createdAt: new Date().getTime(),
            userId: currentUser.uid
        });
        
        // Update statistics by deducting the expense amount
        await updateStatisticsWithExpense(expenseData.amount);
        
        showAlert('success', 'تم إضافة المصروف بنجاح');
        document.getElementById('expenseForm').reset();
        setCurrentDate();
    } catch (error) {
        console.error("Error adding expense:", error);
        showAlert('error', 'حدث خطأ أثناء إضافة المصروف');
    }
}

// Update statistics by deducting expense amount
async function updateStatisticsWithExpense(expenseAmount) {
    try {
        const statsRef = database.ref('statistics');
        const snapshot = await statsRef.once('value');
        
        if (snapshot.exists()) {
            const statistics = snapshot.val();
            const updatedReceivedProfit = (statistics.receivedProfit || 0) - expenseAmount;
            
            // Ensure the profit doesn't go negative
            const finalReceivedProfit = Math.max(0, updatedReceivedProfit);
            
            await statsRef.update({
                receivedProfit: finalReceivedProfit,
                updatedAt: new Date().getTime()
            });
            
            // Update the dashboard if we're on the main page
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
        }
    } catch (error) {
        console.error("Error updating statistics with expense:", error);
    }
}

// Render expenses list
function renderExpenses(filteredExpenses = null) {
    const container = document.getElementById('expensesContainer');
    if (!container) return;
    
    const filterValue = document.getElementById('expenseFilter').value;
    const categoryValue = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('expenseSearch').value.toLowerCase();
    
    let expensesToRender = filteredExpenses || expenses;
    
    // Apply filters
    if (filterValue !== 'all') {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        
        if (filterValue === 'today') {
            expensesToRender = expensesToRender.filter(e => e.date >= todayStart);
        } else if (filterValue === 'week') {
            expensesToRender = expensesToRender.filter(e => e.date >= weekStart);
        } else if (filterValue === 'month') {
            expensesToRender = expensesToRender.filter(e => e.date >= monthStart);
        } else if (filterValue === 'category' && categoryValue !== 'all') {
            expensesToRender = expensesToRender.filter(e => e.category === categoryValue);
        }
    }
    
    // Apply search
    if (searchTerm) {
        expensesToRender = expensesToRender.filter(expense => 
            (expense.description && expense.description.toLowerCase().includes(searchTerm)) || 
            (expense.category && expense.category.toLowerCase().includes(searchTerm)) ||
            (expense.notes && expense.notes.toLowerCase().includes(searchTerm))
        );
    }
    
    if (expensesToRender.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد مصروفات مسجلة</p>';
        return;
    }
    
    // Sort by date (newest first)
    expensesToRender.sort((a, b) => b.date - a.date);
    
    const fragment = document.createDocumentFragment();
    
    expensesToRender.forEach(expense => {
        const card = createExpenseCard(expense);
        fragment.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

// Create expense card
function createExpenseCard(expense) {
    const card = document.createElement('div');
    card.className = 'expense-card';
    card.setAttribute('data-id', expense.id);
    
    card.innerHTML = `
        <div class="expense-header">
            <div class="expense-description">${expense.description || 'بدون وصف'}</div>
            <div class="expense-amount">${formatCurrency(expense.amount || 0)}</div>
        </div>
        
        <div class="expense-details">
            <div class="expense-category">
                <i class="fas fa-tag"></i> ${expense.category || 'غير محدد'}
            </div>
            <div class="expense-date">${formatDate(expense.date)}</div>
        </div>
        
        ${expense.notes ? `
            <div class="expense-notes">
                <i class="fas fa-sticky-note"></i> ${expense.notes}
            </div>
        ` : ''}
        
        <div class="expense-actions">
            <button class="btn btn-danger delete-expense-btn" data-id="${expense.id}">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
    `;
    
    // Add event listener for delete button
    card.querySelector('.delete-expense-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        const expenseId = this.getAttribute('data-id');
        deleteExpense(expenseId);
    });
    
    return card;
}

// Delete expense
async function deleteExpense(expenseId) {
    showConfirmation('هل أنت متأكد من حذف هذا المصروف؟', async () => {
        try {
            const expenseRef = database.ref(`expenses/${expenseId}`);
            const snapshot = await expenseRef.once('value');
            const expense = snapshot.val();
            
            // First restore the statistics by adding back the expense amount
            await restoreStatisticsAfterDelete(expense.amount);
            
            // Then delete the expense
            await expenseRef.remove();
            
            showAlert('success', 'تم حذف المصروف بنجاح');
        } catch (error) {
            console.error("Error deleting expense:", error);
            showAlert('error', 'حدث خطأ أثناء حذف المصروف');
        }
    });
}

// Restore statistics after deleting an expense
async function restoreStatisticsAfterDelete(expenseAmount) {
    try {
        const statsRef = database.ref('statistics');
        const snapshot = await statsRef.once('value');
        
        if (snapshot.exists()) {
            const statistics = snapshot.val();
            const updatedReceivedProfit = (statistics.receivedProfit || 0) + expenseAmount;
            
            await statsRef.update({
                receivedProfit: updatedReceivedProfit,
                updatedAt: new Date().getTime()
            });
            
            // Update the dashboard if we're on the main page
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
        }
    } catch (error) {
        console.error("Error restoring statistics after delete:", error);
    }
}

// Update expenses summary
function updateExpensesSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // Total expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Monthly expenses
    const monthlyExpenses = expenses
        .filter(e => e.date >= monthStart)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Top category
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category || 'أخرى';
        categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
    });
    
    let topCategory = '-';
    let maxAmount = 0;
    
    for (const category in categoryTotals) {
        if (categoryTotals[category] > maxAmount) {
            maxAmount = categoryTotals[category];
            topCategory = category;
        }
    }
    
    // Update UI
    if (document.getElementById('totalExpenses')) {
        document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    }
    
    if (document.getElementById('monthlyExpenses')) {
        document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
    }
    
    if (document.getElementById('topCategory')) {
        document.getElementById('topCategory').textContent = topCategory;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Expense form submission
    document.getElementById('expenseForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const description = document.getElementById('expenseDescription').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const dateInput = document.getElementById('expenseDate').value;
        const category = document.getElementById('expenseCategory').value;
        const notes = document.getElementById('expenseNotes').value;
        
        if (!description || isNaN(amount) || amount <= 0 || !dateInput || !category) {
            showAlert('error', 'الرجاء ملء جميع الحقول المطلوبة بشكل صحيح');
            return;
        }
        
        // Convert date to timestamp
        const date = new Date(dateInput);
        const timestamp = date.getTime();
        
        const expenseData = {
            description,
            amount,
            date: timestamp,
            category,
            notes,
            updatedAt: new Date().getTime()
        };
        
        await addExpense(expenseData);
    });
    
    // Expense filter change
    document.getElementById('expenseFilter')?.addEventListener('change', function() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (this.value === 'category') {
            categoryFilter.style.display = 'inline-block';
        } else {
            categoryFilter.style.display = 'none';
        }
        renderExpenses();
    });
    
    // Category filter change
    document.getElementById('categoryFilter')?.addEventListener('change', function() {
        renderExpenses();
    });
    
    // Expense search
    document.getElementById('expenseSearch')?.addEventListener('input', function() {
        renderExpenses();
    });
    
    // Back to main button
    document.getElementById('backToMainBtn')?.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });
}

// Utility functions
function formatCurrency(amount) {
    if (isNaN(amount)) return '0 د.ع';
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' د.ع';
}

function formatDate(timestamp) {
    if (!timestamp) return '--/--/----';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-IQ');
}

function showConfirmation(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

function showAlert(type, message) {
    alert(message);
}