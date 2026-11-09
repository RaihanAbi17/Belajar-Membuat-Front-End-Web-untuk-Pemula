/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 * Logika aplikasi Expense Tracker menggunakan JavaScript murni.
 */

let transactions = [];
let editingTransactionId = null;

const STORAGE_KEY = 'expenseTrackerTransactions';

/**
 * Menghasilkan ID unik untuk setiap transaksi.
 */
function generateId() {
  return `${+new Date()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * ========================================================
 * Kriteria 1: Manipulasi DOM untuk Form dan Daftar Transaksi
 * ========================================================
 */

const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');

const transactionForm = document.getElementById('transactionForm');
const transactionFormTitleInput = document.getElementById('transactionFormTitleInput');
const transactionFormAmountInput = document.getElementById('transactionFormAmountInput');
const transactionFormDateInput = document.getElementById('transactionFormDateInput');
const transactionFormTypeSelect = document.getElementById('transactionFormTypeSelect');
const transactionFormSubmitButton = document.querySelector(
  '[data-testid="transactionFormSubmitButton"]'
);

const searchTransactionForm = document.getElementById('searchTransactionForm');
const searchTransactionFormTitleInput = document.getElementById('searchTransactionFormTitleInput');

const balanceElement = document.querySelector('.tracker-summary__balance-amount');
const incomeTotalElement = document.querySelector('.tracker-summary__stat-amount--income');
const expenseTotalElement = document.querySelector('.tracker-summary__stat-amount--expense');
const formHeading = document.getElementById('form-heading');
const currentMonthElement = document.querySelector('.tracker-header__date');

function updateCurrentMonth() {
  if (!currentMonthElement) {
    return;
  }

  const now = new Date();

  const monthAndYear = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric'
  }).format(now);

  currentMonthElement.textContent =
    monthAndYear.charAt(0).toUpperCase() + monthAndYear.slice(1);
}

/**
 * Format angka menjadi mata uang Rupiah.
 */
function formatRupiah(amount) {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
}

/**
 * Membuat satu kartu transaksi dengan document.createElement().
 */
function createTransactionCard(transaction) {
  const card = document.createElement('div');
  card.setAttribute('data-testid', 'transactionItem');
  card.className = 'tracker-transaction-item';

  const icon = document.createElement('div');
  icon.setAttribute('data-testid', 'transactionItemIcon');
  icon.className = `tracker-transaction-item__icon tracker-transaction-item__icon--${transaction.type}`;
  icon.textContent = transaction.type === 'income' ? '↗' : '↘';
  icon.setAttribute(
    'aria-label',
    transaction.type === 'income' ? 'Ikon pemasukan' : 'Ikon pengeluaran'
  );

  const detail = document.createElement('div');
  detail.className = 'tracker-transaction-item__detail';

  const title = document.createElement('h3');
  title.setAttribute('data-testid', 'transactionItemTitle');
  title.className = 'tracker-transaction-item__title';
  title.textContent = transaction.title;

  const date = document.createElement('p');
  date.setAttribute('data-testid', 'transactionItemDate');
  date.className = 'tracker-transaction-item__date';
  date.textContent = `Tanggal: ${transaction.date || '-'}`;

  const type = document.createElement('p');
  type.setAttribute('data-testid', 'transactionItemType');
  type.textContent = `Tipe: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

  detail.append(title, date, type);

  const right = document.createElement('div');
  right.className = 'tracker-transaction-item__right';

  const amount = document.createElement('p');
  amount.setAttribute('data-testid', 'transactionItemAmount');
  amount.className = `tracker-transaction-item__amount tracker-transaction-item__amount--${transaction.type}`;
  amount.textContent = `${transaction.type === 'income' ? '+' : '-'} ${formatRupiah(transaction.amount)}`;

  const actions = document.createElement('div');
  actions.className = 'tracker-transaction-item__actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.setAttribute('data-testid', 'transactionItemEditButton');
  editButton.className = 'tracker-transaction-item__btn';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => startEditTransaction(transaction.id));

  const changeTypeButton = document.createElement('button');
  changeTypeButton.type = 'button';
  changeTypeButton.setAttribute('data-testid', 'transactionItemEditTypeButton');
  changeTypeButton.className = 'tracker-transaction-item__btn';
  changeTypeButton.textContent = 'Ubah Tipe';
  changeTypeButton.addEventListener('click', () => toggleTransactionType(transaction.id));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteButton.className = 'tracker-transaction-item__btn';
  deleteButton.textContent = 'Hapus';
  deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));

  actions.append(editButton, changeTypeButton, deleteButton);
  right.append(amount, actions);
  card.append(icon, detail, right);

  return card;
}

/**
 * Render daftar transaksi sesuai tipe dan kata kunci pencarian.
 */
function renderTransactions() {
  incomeList.replaceChildren();
  expenseList.replaceChildren();

  const keyword = searchTransactionFormTitleInput.value.trim().toLowerCase();

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.title.toLowerCase().includes(keyword)
  );

  filteredTransactions.forEach((transaction) => {
    const card = createTransactionCard(transaction);

    if (transaction.type === 'income') {
      incomeList.appendChild(card);
    } else {
      expenseList.appendChild(card);
    }
  });
}

/**
 * Memperbarui ringkasan dasbor.
 */
function updateDashboard() {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpense;

  incomeTotalElement.textContent = formatRupiah(totalIncome);
  expenseTotalElement.textContent = formatRupiah(totalExpense);
  balanceElement.textContent = formatRupiah(balance);

  // Mengubah warna saldo berdasarkan nilainya
  balanceElement.classList.remove(
    'balance-positive',
    'balance-negative',
    'balance-zero'
  );

  if (balance > 0) {
    balanceElement.classList.add('balance-positive');
  } else if (balance < 0) {
    balanceElement.classList.add('balance-negative');
  } else {
    balanceElement.classList.add('balance-zero');
  }
}

/**
 * ========================================================
 * Kriteria 2: Web Storage API
 * ========================================================
 */

/**
 * Simpan seluruh transaksi ke localStorage.
 */
function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/**
 * Muat transaksi dari localStorage.
 */
function loadTransactions() {
  try {
    const savedTransactions = localStorage.getItem(STORAGE_KEY);
    if (!savedTransactions) {
      transactions = [];
      return;
    }

    const parsedTransactions = JSON.parse(savedTransactions);
    transactions = Array.isArray(parsedTransactions) ? parsedTransactions : [];
  } catch (error) {
    transactions = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Kirim custom event setiap kali data transaksi berubah.
 */
function notifyTransactionsUpdated() {
  document.dispatchEvent(new Event('transaction:updated'));
}

/**
 * Satu listener untuk memperbarui seluruh tampilan.
 */
document.addEventListener('transaction:updated', () => {
  saveTransactions();
  renderTransactions();
  updateDashboard();
});

/**
 * Tambah atau perbarui transaksi.
 */
transactionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = transactionFormTitleInput.value.trim();
  const amount = Number(transactionFormAmountInput.value);
  const date = transactionFormDateInput.value;
  const type = transactionFormTypeSelect.value;

  if (!title) {
    alert('Judul transaksi tidak boleh kosong.');
    transactionFormTitleInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount < 1) {
    alert('Nominal transaksi harus minimal Rp1.');
    transactionFormAmountInput.focus();
    return;
  }

  if (editingTransactionId !== null) {
    const transactionIndex = transactions.findIndex(
      (transaction) => String(transaction.id) === String(editingTransactionId)
    );

    if (transactionIndex !== -1) {
      transactions[transactionIndex] = {
        ...transactions[transactionIndex],
        title,
        amount,
        date,
        type
      };
    }

    editingTransactionId = null;
    transactionFormSubmitButton.textContent = 'Simpan';
    formHeading.textContent = 'Tambah Pencatatan Baru';
  } else {
    transactions.push({
      id: generateId(),
      title,
      amount,
      date,
      type
    });
  }

  transactionForm.reset();
  transactionFormTypeSelect.value = 'income';
  notifyTransactionsUpdated();
});

/**
 * Mengisi formulir dengan data transaksi yang akan diedit.
 */
function startEditTransaction(id) {
  const transaction = transactions.find(
    (item) => String(item.id) === String(id)
  );

  if (!transaction) {
    return;
  }

  editingTransactionId = transaction.id;
  transactionFormTitleInput.value = transaction.title;
  transactionFormAmountInput.value = transaction.amount;
  transactionFormDateInput.value = transaction.date;
  transactionFormTypeSelect.value = transaction.type;

  transactionFormSubmitButton.textContent = 'Simpan Perubahan';
  formHeading.textContent = 'Edit Pencatatan';
  transactionFormTitleInput.focus();
  transactionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Menghapus transaksi.
 */
function deleteTransaction(id) {
  transactions = transactions.filter(
    (transaction) => String(transaction.id) !== String(id)
  );

  if (String(editingTransactionId) === String(id)) {
    resetTransactionForm();
  }

  notifyTransactionsUpdated();
}

/**
 * Mengubah tipe transaksi dari income <-> expense.
 */
function toggleTransactionType(id) {
  const transaction = transactions.find(
    (item) => String(item.id) === String(id)
  );

  if (!transaction) {
    return;
  }

  transaction.type = transaction.type === 'income' ? 'expense' : 'income';
  notifyTransactionsUpdated();
}

/**
 * Mengembalikan formulir ke mode tambah.
 */
function resetTransactionForm() {
  editingTransactionId = null;
  transactionForm.reset();
  transactionFormTypeSelect.value = 'income';
  transactionFormSubmitButton.textContent = 'Simpan';
  formHeading.textContent = 'Tambah Pencatatan Baru';
}

/**
 * ========================================================
 * Kriteria 3: Pencarian
 * ========================================================
 */

/**
 * Pencarian langsung saat pengguna mengetik.
 */
searchTransactionFormTitleInput.addEventListener('input', () => {
  renderTransactions();
});

/**
 * Tombol pencarian juga mencegah form melakukan reload.
 */
searchTransactionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderTransactions();
});

/**
 * ========================================================
 * Inisialisasi aplikasi
 * ========================================================
 */
loadTransactions();
updateCurrentMonth();
loadTransactions();
renderTransactions();
updateDashboard();
