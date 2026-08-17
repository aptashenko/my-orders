<script setup lang="ts">
import type {
  AppState,
  Client,
  ClientType,
  CreditCard,
  CreditCardTransfer,
  Deal,
  DealNote,
  DealStatus,
  Expense,
  ExpenseCategory,
  ExpensePlannerCategory,
  ExpensePlannerPayment,
  IncomePlannerCategory,
  IncomePlannerPayment,
  MoneyBalance,
  Payment,
  PaymentStatus,
  PaymentType,
  PlannedExpense,
  PlannedIncome,
  RecurringMode
} from './types/domain'

type NavKey = 'dashboard' | 'clients' | 'expenses' | 'planner'
type WorkspaceKey = 'orders' | 'planner'
type PlannerView = 'overview' | 'categories' | 'creditCards' | 'expensePayments'

interface DealFinancials {
  paid: number
  unpaid: number
  overdue: number
  expected: number
  progress: number
  derivedStatus: string
}

interface ExchangeRates {
  base: 'UAH'
  source: string
  exchangedate: string
  rates: Record<string, number>
}

interface CashForecastDay {
  date: string
  day: number
  openingBalance: number
  income: number
  expense: number
  net: number
  balance: number
}

interface CashChartDay extends CashForecastDay {
  x: number
  balanceY: number
  incomeBarX: number
  incomeBarY: number
  incomeBarHeight: number
  expenseBarX: number
  expenseBarY: number
  expenseBarHeight: number
}

interface CashForecastWeek {
  week: number
  label: string
  startDate: string
  endDate: string
  openingBalance: number
  planned: number
  paid: number
  remaining: number
  overrun: number
  total: number
  count: number
  net: number
  balance: number
  minBalance: number
  gapDays: number
  gapAmount: number
}

interface ExpensePaymentRow {
  payment: ExpensePlannerPayment
  expense?: PlannedExpense
  category?: ExpensePlannerCategory
  creditCard?: CreditCard
}

interface CreditCardPaymentRow {
  id: string
  kind: 'expense' | 'income' | 'transfer'
  paidDate: string
  amount: number
  currency: string
  title: string
  categoryName: string
  notes: string
  payment?: ExpensePlannerPayment | IncomePlannerPayment
  transfer?: CreditCardTransfer
  source?: PlannedExpense | PlannedIncome
}

const workspaceItems: Array<{ key: WorkspaceKey; label: string; icon: string }> = [
  { key: 'orders', label: 'База заказов фриланса', icon: 'pi pi-briefcase' },
  { key: 'planner', label: 'Планировщик', icon: 'pi pi-wallet' }
]

const ordersNavItems: Array<{ key: Exclude<NavKey, 'planner'>; label: string; icon: string }> = [
  { key: 'clients', label: 'Клиенты', icon: 'pi pi-users' },
  { key: 'dashboard', label: 'Дашборд', icon: 'pi pi-chart-line' },
  { key: 'expenses', label: 'Расходы', icon: 'pi pi-receipt' }
]

const clientTypes: Array<{ label: string; value: ClientType }> = [
  { label: 'Постоянный', value: 'regular' },
  { label: 'Разовый', value: 'one_time' }
]

const dealStatuses: Array<{ label: string; value: DealStatus }> = [
  { label: 'Черновик', value: 'draft' },
  { label: 'Предложение', value: 'proposal' },
  { label: 'Подтверждена', value: 'confirmed' },
  { label: 'В работе', value: 'in_progress' },
  { label: 'Ожидает оплаты', value: 'awaiting_payment' },
  { label: 'Частично оплачено', value: 'partially_paid' },
  { label: 'Оплачено', value: 'paid' },
  { label: 'Просрочка', value: 'overdue' },
  { label: 'Пауза', value: 'paused' },
  { label: 'Отменена', value: 'cancelled' }
]

const paymentStatuses: Array<{ label: string; value: PaymentStatus }> = [
  { label: 'Запланирован', value: 'planned' },
  { label: 'Ожидается', value: 'expected' },
  { label: 'Получен', value: 'received' },
  { label: 'Просрочен', value: 'overdue' },
  { label: 'Отменен', value: 'cancelled' }
]

const paymentTypes: Array<{ label: string; value: PaymentType }> = [
  { label: 'Предоплата', value: 'prepayment' },
  { label: 'Этап', value: 'milestone' },
  { label: 'Финальный', value: 'final' },
  { label: 'Возврат', value: 'refund' }
]

const expenseCategories: Array<{ label: string; value: ExpenseCategory }> = [
  { label: 'Сервисы', value: 'services' },
  { label: 'Хостинг', value: 'hosting' },
  { label: 'ПО', value: 'software' },
  { label: 'Подрядчики', value: 'contractors' },
  { label: 'Маркетинг', value: 'marketing' },
  { label: 'Налоги', value: 'taxes' },
  { label: 'Оборудование', value: 'equipment' },
  { label: 'Прочее', value: 'other' }
]

const recurringModes: Array<{ label: string; value: RecurringMode }> = [
  { label: 'Нет', value: 'none' },
  { label: 'Ежемесячно', value: 'monthly' },
  { label: 'Ежегодно', value: 'yearly' }
]

const currencies = ['EUR', 'USD', 'UAH', 'USDT']
const creditExpenseCategoryIds = {
  principal: 'system-credit-principal',
  interest: 'system-credit-interest'
}
const systemExpensePlannerCategories: ExpensePlannerCategory[] = [
  { id: creditExpenseCategoryIds.principal, name: 'Кредит тело', systemType: 'credit_principal' },
  { id: creditExpenseCategoryIds.interest, name: 'Кредит проценты', systemType: 'credit_interest' }
]
const todayIso = new Date().toISOString().slice(0, 10)
const currentMonth = todayIso.slice(0, 7)
const pad2 = (value: number) => String(value).padStart(2, '0')
const monthDayCount = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber, 0).getDate()
}
const isoDate = (year: number, month: number, day: number) => `${year}-${pad2(month)}-${pad2(day)}`
const shortDate = (date: string) => `${date.slice(8, 10)}.${date.slice(5, 7)}`

const state = reactive<AppState>({
  clients: [],
  deals: [],
  payments: [],
  expenses: [],
  expensePlannerCategories: [],
  plannedExpenses: [],
  expensePlannerPayments: [],
  incomePlannerCategories: [],
  plannedIncomes: [],
  incomePlannerPayments: [],
  moneyBalances: [],
  creditCards: [],
  creditCardTransfers: []
})

const selectedNav = ref<NavKey>('clients')
const lastOrdersNav = ref<Exclude<NavKey, 'planner'>>('clients')
const plannerView = ref<PlannerView>('overview')
const selectedMonth = ref(currentMonth)
const selectedMonthFirstIso = () => `${selectedMonth.value}-01`
const selectedMonthLastIso = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return isoDate(year, month, monthDayCount(selectedMonth.value))
}
const selectedClientId = ref('')
const selectedDealId = ref('')
const selectedPlannedExpenseId = ref('')
const selectedPlannedIncomeId = ref('')
const selectedPlannerWeekStart = ref('')
const selectedCreditCardId = ref('')
const clientSearch = ref('')
const plannedExpenseSearch = ref('')
const plannedIncomeSearch = ref('')
const noteText = ref('')
const isClientDialogVisible = ref(false)
const isDealDialogVisible = ref(false)
const isPaymentDialogVisible = ref(false)
const editingDealId = ref('')
const editingPaymentId = ref('')
const isExpenseDialogVisible = ref(false)
const isPlannedExpenseDialogVisible = ref(false)
const isPlannerPaymentDialogVisible = ref(false)
const isPlannedIncomeDialogVisible = ref(false)
const isIncomePlannerPaymentDialogVisible = ref(false)
const isMoneyDialogVisible = ref(false)
const isCreditCardDialogVisible = ref(false)
const isCreditCardTransferDialogVisible = ref(false)
const editingPlannedExpenseId = ref('')
const editingPlannerPaymentId = ref('')
const editingPlannedIncomeId = ref('')
const editingIncomePlannerPaymentId = ref('')
const editingMoneyBalanceId = ref('')
const editingCreditCardId = ref('')
const editingCreditCardTransferId = ref('')
const editingPlannerCategoryId = ref('')
const editingPlannerCategoryName = ref('')
const editingIncomePlannerCategoryId = ref('')
const editingIncomePlannerCategoryName = ref('')
const saveStatus = ref('Синхронизация')
const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const { data, pending, error } = await useFetch<AppState>('/api/state')
if (data.value) {
  Object.assign(state, data.value)
}
if (!state.creditCards) state.creditCards = []
if (!state.creditCardTransfers) state.creditCardTransfers = []
systemExpensePlannerCategories.forEach((category) => {
  const existing = state.expensePlannerCategories.find((item) => item.id === category.id)
  if (existing) {
    Object.assign(existing, { ...category, deletedAt: undefined })
  } else {
    state.expensePlannerCategories.push({ ...category })
  }
})

const { data: exchangeRates, error: ratesError } = await useFetch<ExchangeRates>('/api/rates')

const emptyClient = (): Client => ({
  id: '',
  name: '',
  type: 'regular',
  contact: '',
  defaultCurrency: 'EUR',
  paymentTerms: '',
  notes: ''
})

const emptyDeal = (): Deal => ({
  id: '',
  clientId: selectedClientId.value || state.clients[0]?.id || '',
  title: '',
  amount: 0,
  currency: 'EUR',
  status: 'confirmed',
  startDate: selectedMonthFirstIso(),
  dueDate: selectedMonthLastIso(),
  expectedPaymentDate: selectedMonthLastIso(),
  probability: 100,
  notes: []
})

const emptyPayment = (): Payment => ({
  id: '',
  dealId: selectedDealId.value || '',
  amount: 0,
  dueDate: state.deals.find((deal) => deal.id === selectedDealId.value)?.expectedPaymentDate || selectedMonthLastIso(),
  paidDate: '',
  status: 'expected',
  type: 'milestone',
  method: '',
  invoice: ''
})

const emptyExpense = (): Expense => ({
  id: '',
  dealId: selectedDealId.value || '',
  title: '',
  amount: 0,
  category: 'services',
  date: selectedMonthFirstIso(),
  recurring: 'none'
})

const emptyPlannedExpense = (): PlannedExpense => ({
  id: '',
  title: '',
  categoryId: '',
  creditCardId: '',
  amount: 0,
  currency: 'EUR',
  plannedDate: selectedMonthFirstIso(),
  notes: ''
})

const emptyPlannerPayment = (): ExpensePlannerPayment => ({
  id: '',
  plannedExpenseId: selectedPlannedExpenseId.value || '',
  creditCardId: '',
  amount: 0,
  currency: state.plannedExpenses.find((expense) => expense.id === selectedPlannedExpenseId.value)?.currency || 'EUR',
  paidDate: todayIso,
  notes: ''
})

const emptyPlannerCategory = (): ExpensePlannerCategory => ({
  id: '',
  name: ''
})

const emptyPlannedIncome = (): PlannedIncome => ({
  id: '',
  title: '',
  categoryId: '',
  amount: 0,
  currency: 'EUR',
  plannedDate: selectedMonthFirstIso(),
  notes: ''
})

const emptyIncomePlannerPayment = (): IncomePlannerPayment => ({
  id: '',
  plannedIncomeId: selectedPlannedIncomeId.value || '',
  creditCardId: '',
  amount: 0,
  currency: state.plannedIncomes.find((income) => income.id === selectedPlannedIncomeId.value)?.currency || 'EUR',
  paidDate: todayIso,
  notes: ''
})

const emptyIncomePlannerCategory = (): IncomePlannerCategory => ({
  id: '',
  name: ''
})

const emptyMoneyBalance = (): MoneyBalance => ({
  id: '',
  title: 'Имеющиеся деньги',
  amount: 0,
  currency: 'EUR',
  date: todayIso,
  notes: ''
})

const emptyCreditCard = (): CreditCard => ({
  id: '',
  title: '',
  creditLimit: 0,
  debt: 0,
  currency: 'EUR',
  notes: ''
})

const emptyCreditCardTransfer = (): CreditCardTransfer => ({
  id: '',
  creditCardId: selectedCreditCardId.value || state.creditCards[0]?.id || '',
  amount: 0,
  currency: state.creditCards.find((card) => card.id === selectedCreditCardId.value)?.currency || 'EUR',
  paidDate: todayIso,
  notes: ''
})

const clientForm = reactive<Client>(emptyClient())
const dealForm = reactive<Deal>(emptyDeal())
const paymentForm = reactive<Payment>(emptyPayment())
const expenseForm = reactive<Expense>(emptyExpense())
const plannedExpenseForm = reactive<PlannedExpense>(emptyPlannedExpense())
const plannerPaymentForm = reactive<ExpensePlannerPayment>(emptyPlannerPayment())
const plannerCategoryForm = reactive<ExpensePlannerCategory>(emptyPlannerCategory())
const plannedIncomeForm = reactive<PlannedIncome>(emptyPlannedIncome())
const incomePlannerPaymentForm = reactive<IncomePlannerPayment>(emptyIncomePlannerPayment())
const incomePlannerCategoryForm = reactive<IncomePlannerCategory>(emptyIncomePlannerCategory())
const moneyBalanceForm = reactive<MoneyBalance>(emptyMoneyBalance())
const creditCardForm = reactive<CreditCard>(emptyCreditCard())
const creditCardTransferForm = reactive<CreditCardTransfer>(emptyCreditCardTransfer())

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
const isUnpaid = (payment: Payment) => payment.status !== 'received' && payment.status !== 'cancelled'
const isOverduePayment = (payment: Payment) => isUnpaid(payment) && payment.dueDate < todayIso
const money = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0)
const hasMoneyOverrun = (value: number) => value >= 1
const isSelectedMonthDate = (date: string) => date.startsWith(selectedMonth.value)

const rateFor = (currency = 'EUR') => {
  const normalizedCurrency = currency === 'USDT' ? 'USD' : currency
  if (normalizedCurrency === 'UAH') return 1
  return exchangeRates.value?.rates[normalizedCurrency] ?? 1
}

const toEur = (amount: number, currency = 'EUR') => {
  const normalizedCurrency = currency === 'USDT' ? 'USD' : currency
  if (normalizedCurrency === 'EUR') return amount
  return (amount * rateFor(normalizedCurrency)) / rateFor('EUR')
}

const toUah = (amount: number, currency = 'EUR') => convertCurrency(amount, currency, 'UAH')

const convertCurrency = (amount: number, fromCurrency = 'EUR', toCurrency = 'EUR') => {
  const normalizedTarget = toCurrency === 'USDT' ? 'USD' : toCurrency
  const amountInEur = toEur(amount, fromCurrency)
  if (normalizedTarget === 'EUR') return amountInEur
  return (amountInEur * rateFor('EUR')) / rateFor(normalizedTarget)
}

const paymentCurrency = (payment: Payment) => getDeal(payment.dealId)?.currency ?? 'EUR'
const paymentInEur = (payment: Payment) => toEur(payment.amount, paymentCurrency(payment))
const paymentAccountingMonth = (payment: Payment) => payment.dueDate.slice(0, 7)
const expenseCurrency = (expense: Expense) => getDeal(expense.dealId)?.currency ?? 'EUR'
const expenseInEur = (expense: Expense) => toEur(expense.amount, expenseCurrency(expense))

const monthStart = computed(() => `${selectedMonth.value}-01`)

const monthEnd = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return isoDate(year, month, monthDayCount(selectedMonth.value))
})

const selectedMonthDates = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return Array.from({ length: monthDayCount(selectedMonth.value) }, (_, index) => isoDate(year, month, index + 1))
})

const selectedMonthFirstDate = computed(() => selectedMonthDates.value[0] ?? todayIso)

const selectedMonthLastDate = computed(() => selectedMonthDates.value.at(-1) ?? todayIso)

const selectedMonthLabel = computed(() =>
  new Date(`${selectedMonth.value}-01T00:00:00`).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric'
  })
)

const clientOptions = computed(() =>
  state.clients.map((client) => ({ label: client.name, value: client.id }))
)

const dealOptions = computed(() =>
  state.deals.map((deal) => ({ label: deal.title, value: deal.id }))
)

const activeExpensePlannerCategories = computed(() =>
  state.expensePlannerCategories.filter((category) => !category.deletedAt)
)

const activeIncomePlannerCategories = computed(() =>
  state.incomePlannerCategories.filter((category) => !category.deletedAt)
)

const plannerCategoryOptions = computed(() => [
  ...activeExpensePlannerCategories.value.map((category) => ({ label: category.name, value: category.id }))
])

const incomePlannerCategoryOptions = computed(() => [
  { label: 'Нет категории', value: '' },
  ...activeIncomePlannerCategories.value.map((category) => ({ label: category.name, value: category.id }))
])

const creditCardOptions = computed(() =>
  state.creditCards.map((card) => ({ label: card.title, value: card.id }))
)

const totalCreditLimit = computed(() =>
  state.creditCards.reduce((sum, card) => sum + toEur(card.creditLimit, card.currency), 0)
)

const totalCreditDebt = computed(() =>
  state.creditCards.reduce((sum, card) => sum + toEur(card.debt, card.currency), 0)
)

const totalCreditAvailable = computed(() => totalCreditLimit.value - totalCreditDebt.value)

const selectedClient = computed(() =>
  state.clients.find((client) => client.id === selectedClientId.value)
)

const selectedDeal = computed(() =>
  state.deals.find((deal) => deal.id === selectedDealId.value)
)

const selectedPlannedExpense = computed(() =>
  state.plannedExpenses.find((expense) => expense.id === selectedPlannedExpenseId.value)
)

const selectedPlannedIncome = computed(() =>
  state.plannedIncomes.find((income) => income.id === selectedPlannedIncomeId.value)
)

const selectedPlannerWeek = computed(() =>
  weeklyCashForecast.value.find((week) => week.startDate === selectedPlannerWeekStart.value)
)

const selectedCreditCard = computed(() =>
  state.creditCards.find((card) => card.id === selectedCreditCardId.value)
)

const compareDatesDesc = (left: string, right: string) => right.localeCompare(left)

const latestExpensePaymentDate = (expense: PlannedExpense) =>
  state.expensePlannerPayments
    .filter((payment) => payment.plannedExpenseId === expense.id)
    .reduce((latest, payment) => (payment.paidDate > latest ? payment.paidDate : latest), '')

const comparePlannedExpensesByFactDate = (left: PlannedExpense, right: PlannedExpense) => {
  const leftFactDate = latestExpensePaymentDate(left)
  const rightFactDate = latestExpensePaymentDate(right)

  if (leftFactDate || rightFactDate) {
    return compareDatesDesc(leftFactDate || left.plannedDate, rightFactDate || right.plannedDate)
  }

  return compareDatesDesc(left.plannedDate, right.plannedDate)
}

const selectedCreditCardExpenses = computed(() => {
  if (!selectedCreditCard.value) return []
  return state.plannedExpenses
    .filter((expense) => !isCreditPrincipalExpense(expense))
    .filter((expense) => {
      if (expense.creditCardId === selectedCreditCard.value?.id) return true
      return state.expensePlannerPayments.some(
        (payment) =>
          payment.plannedExpenseId === expense.id && payment.creditCardId === selectedCreditCard.value?.id
      )
    })
    .sort(comparePlannedExpensesByFactDate)
})

const selectedCreditCardPaid = computed(() =>
  selectedCreditCardPaymentRows.value
    .filter((row) => row.kind === 'expense')
    .reduce((sum, row) => sum + toEur(row.amount, row.currency), 0)
)

const selectedCreditCardIncomePaid = computed(() =>
  selectedCreditCardPaymentRows.value
    .filter((row) => row.kind === 'income')
    .reduce((sum, row) => sum + toEur(row.amount, row.currency), 0)
)

const selectedCreditCardTransferPaid = computed(() =>
  selectedCreditCardPaymentRows.value
    .filter((row) => row.kind === 'transfer')
    .reduce((sum, row) => sum + toEur(row.amount, row.currency), 0)
)

const selectedCreditCardPaymentRows = computed<CreditCardPaymentRow[]>(() => {
  if (!selectedCreditCard.value) return []

  const cardId = selectedCreditCard.value.id
  const creditPrincipalExpenses = state.plannedExpenses
    .filter((expense) => expense.creditCardId === cardId && getPlannerCategory(expense.categoryId)?.systemType === 'credit_principal')
    .map((expense) => ({
      id: expense.id,
      kind: 'transfer' as const,
      paidDate: latestExpensePaymentDate(expense) || expense.plannedDate,
      amount: expense.amount,
      currency: expense.currency,
      title: plannedExpenseTitle(expense),
      categoryName: 'Перевод с баланса',
      notes: expense.notes,
      source: expense
    }))

  const expenses = state.expensePlannerPayments
    .filter((payment) => payment.creditCardId === cardId)
    .map((payment) => {
      const expense = getPlannedExpense(payment.plannedExpenseId)
      const category = expense ? getPlannerCategory(expense.categoryId) : undefined
      const isCreditPrincipalPayment = category?.systemType === 'credit_principal'
      return {
        id: payment.id,
        kind: isCreditPrincipalPayment ? 'transfer' as const : 'expense' as const,
        paidDate: payment.paidDate,
        amount: payment.amount,
        currency: payment.currency,
        title: expense ? plannedExpenseTitle(expense) : 'Расход',
        categoryName: category?.name ?? 'Без категории',
        notes: payment.notes,
        payment,
        source: expense
      }
    })

  const transfers = state.creditCardTransfers
    .filter((transfer) => transfer.creditCardId === cardId)
    .map((transfer) => ({
      id: transfer.id,
      kind: 'transfer' as const,
      paidDate: transfer.paidDate,
      amount: transfer.amount,
      currency: transfer.currency,
      title: 'Перевод на кредитную карту',
      categoryName: 'Перевод с баланса',
      notes: transfer.notes,
      transfer
    }))

  const incomes = state.incomePlannerPayments
    .filter((payment) => payment.creditCardId === cardId)
    .map((payment) => {
      const income = getPlannedIncome(payment.plannedIncomeId)
      return {
        id: payment.id,
        kind: 'income' as const,
        paidDate: payment.paidDate,
        amount: payment.amount,
        currency: payment.currency,
        title: income?.title || 'Доход',
        categoryName: income ? getIncomePlannerCategory(income.categoryId)?.name ?? 'Без категории' : 'Без категории',
        notes: payment.notes,
        payment,
        source: income
      }
    })

  return [...creditPrincipalExpenses, ...expenses.filter((row) => row.kind !== 'transfer'), ...transfers, ...incomes].sort(
    (left, right) => compareDatesDesc(left.paidDate, right.paidDate) || right.id.localeCompare(left.id)
  )
})

const dealPaymentMonths = (deal: Deal) =>
  state.payments
    .filter((payment) => payment.dealId === deal.id && payment.status !== 'cancelled')
    .map((payment) => paymentAccountingMonth(payment))

const dealAppliesToMonth = (deal: Deal) =>
  [deal.startDate, deal.dueDate, deal.expectedPaymentDate]
    .filter(Boolean)
    .some((date) => date.startsWith(selectedMonth.value)) || dealPaymentMonths(deal).includes(selectedMonth.value)

const monthDeals = computed(() =>
  state.deals.filter((deal) => dealAppliesToMonth(deal))
)

const clientDealsForMonth = (client: Client) =>
  monthDeals.value.filter((deal) => deal.clientId === client.id)

const clientDeals = computed(() =>
  selectedClient.value ? clientDealsForMonth(selectedClient.value) : []
)

const orderPayments = computed(() =>
  selectedDeal.value ? state.payments.filter((payment) => payment.dealId === selectedDeal.value?.id) : []
)

const selectedDealExpenses = computed(() =>
  selectedDeal.value ? state.expenses.filter((expense) => expense.dealId === selectedDeal.value?.id) : []
)

const selectedPlannerPayments = computed(() =>
  selectedPlannedExpense.value
    ? state.expensePlannerPayments
        .filter((payment) => payment.plannedExpenseId === selectedPlannedExpense.value?.id)
        .sort((left, right) => compareDatesDesc(left.paidDate, right.paidDate))
    : []
)

const expensePaymentRows = computed<ExpensePaymentRow[]>(() =>
  state.expensePlannerPayments
    .filter(isTrackedPlannerPayment)
    .map((payment) => {
      const expense = getPlannedExpense(payment.plannedExpenseId)
      return {
        payment,
        expense,
        category: expense ? getPlannerCategory(expense.categoryId) : undefined,
        creditCard: getCreditCard(payment.creditCardId)
      }
    })
    .sort((left, right) => {
      const dateOrder = compareDatesDesc(left.payment.paidDate, right.payment.paidDate)
      return dateOrder || right.payment.id.localeCompare(left.payment.id)
    })
)

const expensePaymentRowsTotal = computed(() =>
  expensePaymentRows.value.reduce((sum, row) => sum + plannerPaymentInEur(row.payment), 0)
)

const selectedIncomePlannerPayments = computed(() =>
  selectedPlannedIncome.value
    ? state.incomePlannerPayments.filter((payment) => payment.plannedIncomeId === selectedPlannedIncome.value?.id)
    : []
)

const filteredClients = computed(() => {
  const query = clientSearch.value.trim().toLowerCase()
  if (!query) return state.clients
  return state.clients.filter((client) =>
    `${client.name} ${client.contact} ${client.notes}`.toLowerCase().includes(query)
  )
})

const filteredPlannedExpenses = computed(() => {
  const query = plannedExpenseSearch.value.trim().toLowerCase()
  const monthExpenses = state.plannedExpenses.filter(
    (expense) => isSelectedMonthDate(expense.plannedDate) && isTrackedPlannedExpense(expense)
  )
  if (!query) return monthExpenses.sort(comparePlannedExpensesByFactDate)

  return monthExpenses
    .filter((expense) => {
      const category = getPlannerCategory(expense.categoryId)
      return `${category?.name ?? ''} ${expense.notes}`.toLowerCase().includes(query)
    })
    .sort(comparePlannedExpensesByFactDate)
})

const filteredPlannedIncomes = computed(() => {
  const query = plannedIncomeSearch.value.trim().toLowerCase()
  const monthIncomes = state.plannedIncomes.filter((income) => isSelectedMonthDate(income.plannedDate))
  if (!query) return monthIncomes

  return monthIncomes.filter((income) => {
    const category = getIncomePlannerCategory(income.categoryId)
    return `${income.title} ${category?.name ?? ''} ${income.notes}`.toLowerCase().includes(query)
  })
})

const monthPayments = computed(() =>
  state.payments.filter((payment) => paymentAccountingMonth(payment) === selectedMonth.value)
)

const monthActivePayments = computed(() =>
  monthPayments.value.filter((payment) => payment.status !== 'cancelled')
)

const monthDashboardPayments = computed(() =>
  [...monthActivePayments.value].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
)

const monthDashboardClients = computed(() =>
  state.clients.filter((client) => monthDeals.value.some((deal) => deal.clientId === client.id))
)

const activePayments = computed(() =>
  state.payments.filter((payment) => payment.status !== 'cancelled')
)

const overduePayments = computed(() =>
  state.payments.filter((payment) => isOverduePayment(payment))
)

const expenseAppliesToMonth = (expense: Expense) => {
  if (expense.recurring === 'none') return expense.date.startsWith(selectedMonth.value)
  if (expense.date > monthEnd.value) return false
  if (expense.recurring === 'monthly') return true
  return expense.date.slice(5, 7) === selectedMonth.value.slice(5, 7)
}

const monthExpenses = computed(() =>
  state.expenses.filter((expense) => expenseAppliesToMonth(expense))
)

const plannerPaymentInEur = (payment: ExpensePlannerPayment) => toEur(payment.amount, payment.currency)
const plannedExpenseInEur = (expense: PlannedExpense) => toEur(expense.amount, expense.currency)
const incomePlannerPaymentInEur = (payment: IncomePlannerPayment) => toEur(payment.amount, payment.currency)
const plannedIncomeInEur = (income: PlannedIncome) => toEur(income.amount, income.currency)
const moneyBalanceInEur = (balance: MoneyBalance) => toEur(balance.amount, balance.currency)

const plannerExpenseFinancials = (expense: PlannedExpense) => {
  const payments = state.expensePlannerPayments.filter((payment) => payment.plannedExpenseId === expense.id)
  const paid = payments.reduce(
    (sum, payment) => sum + convertCurrency(payment.amount, payment.currency, expense.currency),
    0
  )
  const planned = expense.amount
  const remaining = Math.max(0, planned - paid)
  const overrun = Math.max(0, paid - planned)
  const progress = planned > 0 ? Math.min(100, Math.round((paid / planned) * 100)) : 0

  return { paid, planned, remaining, overrun, progress, payments: payments.length }
}

const plannedExpenseRowClass = (expense: PlannedExpense) =>
  hasMoneyOverrun(plannerExpenseFinancials(expense).overrun) ? '!bg-red-50 text-red-900' : ''

const plannerIncomeFinancials = (income: PlannedIncome) => {
  const payments = state.incomePlannerPayments.filter((payment) => payment.plannedIncomeId === income.id)
  const paid = payments.reduce(
    (sum, payment) => sum + convertCurrency(payment.amount, payment.currency, income.currency),
    0
  )
  const planned = income.amount
  const remaining = Math.max(0, planned - paid)
  const progress = planned > 0 ? Math.min(100, Math.round((paid / planned) * 100)) : 0

  return { paid, planned, remaining, progress, payments: payments.length }
}

const totalMoneyBalances = computed(() =>
  state.moneyBalances.reduce((sum, balance) => sum + moneyBalanceInEur(balance), 0)
)

const totalPlannerPaid = computed(() =>
  state.expensePlannerPayments
    .filter(isTrackedPlannerPayment)
    .reduce((sum, payment) => sum + plannerPaymentInEur(payment), 0)
)

const totalPlannerPlanned = computed(() =>
  state.plannedExpenses
    .filter(isTrackedPlannedExpense)
    .reduce((sum, expense) => sum + plannedExpenseInEur(expense), 0)
)

const totalIncomePlannerPaid = computed(() =>
  state.incomePlannerPayments.reduce((sum, payment) => sum + incomePlannerPaymentInEur(payment), 0)
)

const totalCreditCardTransferPaid = computed(() => {
  const transfers = state.creditCardTransfers.reduce((sum, transfer) => sum + toEur(transfer.amount, transfer.currency), 0)
  const legacyPrincipalTransfers = state.plannedExpenses
    .filter(isCreditPrincipalExpense)
    .reduce((sum, expense) => sum + plannedExpenseInEur(expense), 0)

  return transfers + legacyPrincipalTransfers
})

const totalIncomePlannerPlanned = computed(() =>
  state.plannedIncomes.reduce((sum, income) => sum + plannedIncomeInEur(income), 0)
)

const monthWeekRanges = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number)
  const lastDay = monthDayCount(monthValue)
  const ranges: Array<[number, number]> = []
  let start = 1

  while (start <= lastDay) {
    const dayOfWeek = new Date(year, month - 1, start).getDay()
    const daysUntilSunday = (7 - dayOfWeek) % 7
    const end = Math.min(start + daysUntilSunday, lastDay)
    ranges.push([start, end])
    start = end + 1
  }

  return ranges
    .filter(([start]) => start <= lastDay)
    .map(([start, end], index) => ({
      week: index + 1,
      startDate: isoDate(year, month, start),
      endDate: isoDate(year, month, Math.min(end, lastDay))
    }))
}

const plannerMetrics = computed(() => {
  const plannedMonth = state.plannedExpenses
    .filter((expense) => expense.plannedDate.startsWith(selectedMonth.value) && isTrackedPlannedExpense(expense))
    .reduce((sum, expense) => sum + plannedExpenseInEur(expense), 0)
  const paidMonth = state.expensePlannerPayments
    .filter((payment) => payment.paidDate.startsWith(selectedMonth.value) && isTrackedPlannerPayment(payment))
    .reduce((sum, payment) => sum + plannerPaymentInEur(payment), 0)
  const plannedIncomeMonth = state.plannedIncomes
    .filter((income) => income.plannedDate.startsWith(selectedMonth.value))
    .reduce((sum, income) => sum + plannedIncomeInEur(income), 0)
  const receivedIncomeMonth = state.incomePlannerPayments
    .filter((payment) => payment.paidDate.startsWith(selectedMonth.value))
    .reduce((sum, payment) => sum + incomePlannerPaymentInEur(payment), 0)
  const remainingMonth = monthWeekRanges(selectedMonth.value).reduce((total, week) => {
    const plannedExpenses = state.plannedExpenses.filter(
      (expense) =>
        expense.plannedDate >= week.startDate &&
        expense.plannedDate <= week.endDate &&
        isTrackedPlannedExpense(expense)
    )
    const planned = plannedExpenses.reduce((sum, expense) => sum + plannedExpenseInEur(expense), 0)
    const paid = plannedExpenses.reduce(
      (sum, expense) => sum + toEur(plannerExpenseFinancials(expense).paid, expense.currency),
      0
    )

    return total + Math.max(0, planned - paid)
  }, 0)
  const remainingTotal = state.plannedExpenses
    .filter(isTrackedPlannedExpense)
    .reduce((sum, expense) => sum + toEur(plannerExpenseFinancials(expense).remaining, expense.currency), 0)
  const remainingIncomeMonth = state.plannedIncomes
    .filter((income) => income.plannedDate.startsWith(selectedMonth.value))
    .reduce((sum, income) => sum + toEur(plannerIncomeFinancials(income).remaining, income.currency), 0)
  const remainingIncomeTotal = state.plannedIncomes
    .reduce((sum, income) => sum + toEur(plannerIncomeFinancials(income).remaining, income.currency), 0)
  const cashBalance = totalMoneyBalances.value + totalIncomePlannerPaid.value - totalPlannerPaid.value - totalCreditCardTransferPaid.value

  return {
    plannedMonth,
    paidMonth,
    plannedIncomeMonth,
    receivedIncomeMonth,
    remainingMonth,
    remainingIncomeMonth,
    totalMoney: totalMoneyBalances.value,
    totalPaid: totalPlannerPaid.value,
    totalIncomePaid: totalIncomePlannerPaid.value,
    remainingTotal,
    remainingIncomeTotal,
    cashBalance,
    freeAfterPlan: cashBalance + remainingIncomeMonth - remainingMonth
  }
})

const dailyCashForecast = computed<CashForecastDay[]>(() => {
  const incomeByDate = new Map<string, number>()
  const expenseByDate = new Map<string, number>()
  const isCurrentMonthForecast = selectedMonth.value === currentMonth
  const includeForecastDate = (date: string) =>
    date.startsWith(selectedMonth.value) || (isCurrentMonthForecast && date < todayIso)
  const forecastDate = (date: string) => (isCurrentMonthForecast && date < todayIso ? todayIso : date)
  const add = (map: Map<string, number>, date: string, amount: number) => {
    if (amount <= 0) return
    const dateKey = forecastDate(date)
    map.set(dateKey, (map.get(dateKey) ?? 0) + amount)
  }

  state.plannedIncomes.forEach((income) => {
    if (includeForecastDate(income.plannedDate)) {
      const amount = isCurrentMonthForecast
        ? toEur(plannerIncomeFinancials(income).remaining, income.currency)
        : plannedIncomeInEur(income)
      add(incomeByDate, income.plannedDate, amount)
    }
  })

  state.plannedExpenses.forEach((expense) => {
    if (isTrackedPlannedExpense(expense) && includeForecastDate(expense.plannedDate)) {
      const amount = isCurrentMonthForecast
        ? toEur(plannerExpenseFinancials(expense).remaining, expense.currency)
        : plannedExpenseInEur(expense)
      add(expenseByDate, expense.plannedDate, amount)
    }
  })

  let balance = isCurrentMonthForecast ? plannerMetrics.value.cashBalance : totalMoneyBalances.value

  return selectedMonthDates.value.map((date) => {
    const openingBalance = balance
    const income = incomeByDate.get(date) ?? 0
    const expense = expenseByDate.get(date) ?? 0
    const net = income - expense
    balance += net

    return {
      date,
      day: Number(date.slice(8, 10)),
      openingBalance,
      income,
      expense,
      net,
      balance
    }
  })
})

const cashForecastTotals = computed(() => {
  const income = dailyCashForecast.value.reduce((sum, day) => sum + day.income, 0)
  const expense = dailyCashForecast.value.reduce((sum, day) => sum + day.expense, 0)
  const minDay = dailyCashForecast.value.reduce<CashForecastDay | null>(
    (lowest, day) => (!lowest || day.balance < lowest.balance ? day : lowest),
    null
  )
  const firstGap = dailyCashForecast.value.find((day) => day.balance < 0) ?? null
  const peakExpenseDay = dailyCashForecast.value.reduce<CashForecastDay | null>(
    (highest, day) => (!highest || day.expense > highest.expense ? day : highest),
    null
  )

  return {
    income,
    expense,
    endBalance: dailyCashForecast.value.at(-1)?.balance ?? totalMoneyBalances.value,
    minDay,
    firstGap,
    peakExpenseDay
  }
})

const cashGapDays = computed(() => dailyCashForecast.value.filter((day) => day.balance < 0))

const cashTableRows = computed(() =>
  dailyCashForecast.value.filter((day) => day.income > 0 || day.expense > 0 || day.balance < 0)
)

const selectedMonthWeeks = computed(() => monthWeekRanges(selectedMonth.value))

const weeklyCashForecast = computed<CashForecastWeek[]>(() =>
  selectedMonthWeeks.value.map((week) => {
    const days = dailyCashForecast.value.filter((day) => day.date >= week.startDate && day.date <= week.endDate)
    const plannedExpenses = state.plannedExpenses.filter(
      (expense) =>
        expense.plannedDate >= week.startDate &&
        expense.plannedDate <= week.endDate &&
        isTrackedPlannedExpense(expense)
    )
    const planned = plannedExpenses.reduce((sum, expense) => sum + plannedExpenseInEur(expense), 0)
    const paid = plannedExpenses.reduce(
      (sum, expense) => sum + toEur(plannerExpenseFinancials(expense).paid, expense.currency),
      0
    )
    const remaining = Math.max(0, planned - paid)
    const overrun = Math.max(0, paid - planned)
    const minBalance = days.reduce((minimum, day) => Math.min(minimum, day.balance), days[0]?.balance ?? 0)
    const openingBalance = days[0]?.openingBalance ?? 0
    const balance = days.at(-1)?.balance ?? openingBalance
    const gapDays = days.filter((day) => day.balance < 0).length

    return {
      week: week.week,
      label: `${shortDate(week.startDate)} - ${shortDate(week.endDate)}`,
      startDate: week.startDate,
      endDate: week.endDate,
      openingBalance,
      planned,
      paid,
      remaining,
      overrun,
      total: paid + remaining,
      count: plannedExpenses.length,
      net: -planned,
      balance,
      minBalance,
      gapDays,
      gapAmount: Math.max(0, -minBalance)
    }
  })
)

const weeklyCashGapRows = computed(() => weeklyCashForecast.value.filter((week) => week.gapDays > 0))

const selectedPlannerWeekExpenses = computed(() => {
  if (!selectedPlannerWeek.value) return []
  const query = plannedExpenseSearch.value.trim().toLowerCase()
  const expenses = state.plannedExpenses.filter(
    (expense) =>
      expense.plannedDate >= selectedPlannerWeek.value!.startDate &&
      expense.plannedDate <= selectedPlannerWeek.value!.endDate &&
      isTrackedPlannedExpense(expense)
  )

  if (!query) return expenses.sort(comparePlannedExpensesByFactDate)

  return expenses
    .filter((expense) => {
      const category = getPlannerCategory(expense.categoryId)
      return `${category?.name ?? ''} ${expense.notes}`.toLowerCase().includes(query)
    })
    .sort(comparePlannedExpensesByFactDate)
})

const cashChart = computed(() => {
  const width = 960
  const height = 360
  const left = 72
  const right = 18
  const lineTop = 24
  const lineBottom = 228
  const barTop = 260
  const barZeroY = 300
  const barBottom = 338
  const plotWidth = width - left - right
  const days = dailyCashForecast.value
  const balances = days.map((day) => day.balance)
  const rawMin = Math.min(0, ...balances)
  const rawMax = Math.max(0, ...balances)
  const rawRange = Math.max(1, rawMax - rawMin)
  const minValue = rawMin - rawRange * 0.12
  const maxValue = rawMax + rawRange * 0.12
  const valueRange = Math.max(1, maxValue - minValue)
  const maxFlow = Math.max(1, ...days.flatMap((day) => [day.income, day.expense]))
  const barSlot = plotWidth / Math.max(1, days.length)
  const barWidth = Math.min(10, Math.max(4, barSlot * 0.28))
  const xFor = (index: number) =>
    left + (days.length <= 1 ? plotWidth / 2 : (index / (days.length - 1)) * plotWidth)
  const yFor = (value: number) => lineTop + ((maxValue - value) / valueRange) * (lineBottom - lineTop)
  const barHeightFor = (value: number) => Math.max(0, (value / maxFlow) * (barZeroY - barTop))

  const chartDays: CashChartDay[] = days.map((day, index) => {
    const x = xFor(index)
    const incomeBarHeight = barHeightFor(day.income)
    const expenseBarHeight = Math.max(0, (day.expense / maxFlow) * (barBottom - barZeroY))

    return {
      ...day,
      x,
      balanceY: yFor(day.balance),
      incomeBarX: x - barWidth - 1,
      incomeBarY: barZeroY - incomeBarHeight,
      incomeBarHeight,
      expenseBarX: x + 1,
      expenseBarY: barZeroY,
      expenseBarHeight
    }
  })

  const linePath = chartDays
    .map((day, index) => `${index === 0 ? 'M' : 'L'} ${day.x.toFixed(2)} ${day.balanceY.toFixed(2)}`)
    .join(' ')
  const zeroY = yFor(0)
  const areaPath = chartDays.length
    ? `${linePath} L ${chartDays.at(-1)!.x.toFixed(2)} ${zeroY.toFixed(2)} L ${chartDays[0].x.toFixed(2)} ${zeroY.toFixed(2)} Z`
    : ''
  const tickValues = Array.from({ length: 5 }, (_, index) => maxValue - (valueRange / 4) * index)
  const yTicks = tickValues.map((value) => ({
    value,
    y: yFor(value),
    label: money(value, 'EUR')
  }))
  const xTicks = chartDays.filter((day, index) => index === 0 || index === chartDays.length - 1 || day.day % 5 === 0)

  return {
    width,
    height,
    left,
    right,
    lineTop,
    lineBottom,
    barTop,
    barZeroY,
    barBottom,
    plotWidth,
    zeroY,
    linePath,
    areaPath,
    yTicks,
    xTicks,
    days: chartDays
  }
})

const plannerCategoryRows = computed(() => {
  const rows = new Map<string, { id: string; name: string; planned: number; paid: number; count: number }>()
  const ensure = (categoryId: string) => {
    const key = categoryId || 'none'
    if (!rows.has(key)) {
      rows.set(key, {
        id: key,
        name: getPlannerCategory(categoryId)?.name ?? 'Без категории',
        planned: 0,
        paid: 0,
        count: 0
      })
    }
    return rows.get(key)!
  }

  state.plannedExpenses
    .filter((expense) => isSelectedMonthDate(expense.plannedDate) && isTrackedPlannedExpense(expense))
    .forEach((expense) => {
    const row = ensure(expense.categoryId)
    row.planned += plannedExpenseInEur(expense)
    row.count += 1
  })

  state.expensePlannerPayments
    .filter((payment) => isSelectedMonthDate(payment.paidDate) && isTrackedPlannerPayment(payment))
    .forEach((payment) => {
    const expense = getPlannedExpense(payment.plannedExpenseId)
    const row = ensure(expense?.categoryId ?? '')
    row.paid += plannerPaymentInEur(payment)
  })

  return [...rows.values()]
    .sort((a, b) => b.planned - a.planned)
    .map((row) => ({
      ...row,
      remaining: Math.max(0, row.planned - row.paid),
      overrun: Math.max(0, row.paid - row.planned)
    }))
})

const incomePlannerCategoryRows = computed(() => {
  const rows = new Map<string, { id: string; name: string; planned: number; paid: number; count: number }>()
  const ensure = (categoryId: string) => {
    const key = categoryId || 'none'
    if (!rows.has(key)) {
      rows.set(key, {
        id: key,
        name: getIncomePlannerCategory(categoryId)?.name ?? 'Без категории',
        planned: 0,
        paid: 0,
        count: 0
      })
    }
    return rows.get(key)!
  }

  state.plannedIncomes.filter((income) => isSelectedMonthDate(income.plannedDate)).forEach((income) => {
    const row = ensure(income.categoryId)
    row.planned += plannedIncomeInEur(income)
    row.count += 1
  })

  state.incomePlannerPayments.filter((payment) => isSelectedMonthDate(payment.paidDate)).forEach((payment) => {
    const income = getPlannedIncome(payment.plannedIncomeId)
    const row = ensure(income?.categoryId ?? '')
    row.paid += incomePlannerPaymentInEur(payment)
  })

  return [...rows.values()]
    .sort((a, b) => b.planned - a.planned)
    .map((row) => ({
      ...row,
      remaining: Math.max(0, row.planned - row.paid)
    }))
})

const plannerMonthRows = computed(() => {
  const rows = new Map<string, { month: string; planned: number; paid: number }>()
  const ensure = (month: string) => {
    if (!rows.has(month)) rows.set(month, { month, planned: 0, paid: 0 })
    return rows.get(month)!
  }

  state.plannedExpenses.filter(isTrackedPlannedExpense).forEach((expense) => {
    ensure(expense.plannedDate.slice(0, 7)).planned += plannedExpenseInEur(expense)
  })
  state.expensePlannerPayments.filter(isTrackedPlannerPayment).forEach((payment) => {
    ensure(payment.paidDate.slice(0, 7)).paid += plannerPaymentInEur(payment)
  })

  return [...rows.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({ ...row, remaining: Math.max(0, row.planned - row.paid) }))
})

const incomePlannerMonthRows = computed(() => {
  const rows = new Map<string, { month: string; planned: number; paid: number }>()
  const ensure = (month: string) => {
    if (!rows.has(month)) rows.set(month, { month, planned: 0, paid: 0 })
    return rows.get(month)!
  }

  state.plannedIncomes.forEach((income) => {
    ensure(income.plannedDate.slice(0, 7)).planned += plannedIncomeInEur(income)
  })
  state.incomePlannerPayments.forEach((payment) => {
    ensure(payment.paidDate.slice(0, 7)).paid += incomePlannerPaymentInEur(payment)
  })

  return [...rows.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({ ...row, remaining: Math.max(0, row.planned - row.paid) }))
})

const metrics = computed(() => {
  const received = monthActivePayments.value
    .filter((payment) => payment.status === 'received')
    .reduce((sum, payment) => sum + paymentInEur(payment), 0)
  const expected = monthActivePayments.value
    .filter((payment) => isUnpaid(payment))
    .reduce((sum, payment) => sum + paymentInEur(payment), 0)
  const expenses = monthExpenses.value.reduce((sum, expense) => sum + expenseInEur(expense), 0)
  const plannedRevenue = received + expected
  const orderAmount = monthDeals.value.reduce((sum, deal) => sum + toEur(deal.amount, deal.currency), 0)
  const debt = activePayments.value
    .filter((payment) => isUnpaid(payment))
    .reduce((sum, payment) => sum + paymentInEur(payment), 0)
  const overdue = monthActivePayments.value
    .filter((payment) => isOverduePayment(payment))
    .reduce((sum, payment) => sum + paymentInEur(payment), 0)
  const weightedForecast = state.payments
    .filter((payment) => isUnpaid(payment))
    .reduce((sum, payment) => {
      const deal = getDeal(payment.dealId)
      return sum + paymentInEur(payment) * ((deal?.probability ?? 100) / 100)
    }, 0)

  return {
    received,
    expected,
    expenses,
    orderAmount,
    profit: received - expenses,
    plannedRevenue,
    plannedProfit: plannedRevenue - expenses,
    debt,
    overdue,
    weightedForecast,
    clients: monthDashboardClients.value.length,
    deals: monthDeals.value.length,
    payments: monthActivePayments.value.length,
    receivedPayments: monthActivePayments.value.filter((payment) => payment.status === 'received').length,
    expectedPayments: monthActivePayments.value.filter((payment) => isUnpaid(payment)).length,
    overduePayments: monthActivePayments.value.filter((payment) => isOverduePayment(payment)).length
  }
})

const selectedWorkspace = computed<WorkspaceKey>(() => (selectedNav.value === 'planner' ? 'planner' : 'orders'))

const pageTitle = computed(() => {
  if (selectedNav.value === 'dashboard') return 'Дашборд'
  if (selectedNav.value === 'expenses') return 'Расходы'
  if (selectedNav.value === 'planner') {
    if (plannerView.value === 'categories') return 'Категории'
    if (plannerView.value === 'creditCards') return 'Кредитные карты'
    if (plannerView.value === 'expensePayments') return 'Платежи расходов'
    if (selectedPlannerWeek.value) return `Неделя ${selectedPlannerWeek.value.week}`
    return selectedPlannedExpense.value
      ? plannedExpenseTitle(selectedPlannedExpense.value)
      : selectedPlannedIncome.value?.title ?? 'Планировщик'
  }
  if (selectedDeal.value) return selectedDeal.value.title
  if (selectedClient.value) return selectedClient.value.name
  return 'Клиенты'
})

const pageSubtitle = computed(() => {
  if (selectedNav.value === 'dashboard') return 'Аналитика, статистика, задолженности и прогнозы'
  if (selectedNav.value === 'expenses') return 'Операционные, проектные и повторяющиеся расходы'
  if (selectedNav.value === 'planner') {
    if (plannerView.value === 'categories') return 'Управление категориями доходов и расходов'
    if (plannerView.value === 'creditCards') return 'Кредитные лимиты, задолженность и доступный остаток'
    if (plannerView.value === 'expensePayments') return 'Все фактические платежи по расходам, отсортированные по дате'
    if (selectedPlannerWeek.value) return `Расходы ${selectedPlannerWeek.value.label}, месячные доходы остаются общими`
    if (selectedPlannedIncome.value) return 'Карточка дохода, плановая сумма и фактические платежи'
    return selectedPlannedExpense.value
      ? 'Карточка расхода, плановая сумма и фактические платежи'
      : 'План-факт доходов и расходов, категории, фактические платежи и имеющиеся деньги'
  }
  if (selectedDeal.value) return `${getClient(selectedDeal.value.clientId)?.name ?? 'Клиент'} · платежи и заметки заказа`
  if (selectedClient.value) return 'Заказы клиента, задолженность и история оплат'
  return 'Список клиентов и их финансовый статус'
})

const getClient = (clientId: string) => state.clients.find((client) => client.id === clientId)
const getDeal = (dealId: string) => state.deals.find((deal) => deal.id === dealId)
const getPlannedExpense = (expenseId: string) => state.plannedExpenses.find((expense) => expense.id === expenseId)
const getPlannedIncome = (incomeId: string) => state.plannedIncomes.find((income) => income.id === incomeId)
const getPlannerCategory = (categoryId: string) =>
  state.expensePlannerCategories.find((category) => category.id === categoryId)
const getIncomePlannerCategory = (categoryId: string) =>
  state.incomePlannerCategories.find((category) => category.id === categoryId)
const getCreditCard = (cardId?: string) => state.creditCards.find((card) => card.id === cardId)
const creditCardAvailable = (card: CreditCard) => card.creditLimit - card.debt
const isCreditPrincipalExpense = (expense?: PlannedExpense) =>
  !!expense && getPlannerCategory(expense.categoryId)?.systemType === 'credit_principal'
const isTrackedPlannedExpense = (expense: PlannedExpense) => !isCreditPrincipalExpense(expense)
const isTrackedPlannerPayment = (payment: ExpensePlannerPayment) => {
  const expense = getPlannedExpense(payment.plannedExpenseId)
  return !expense || isTrackedPlannedExpense(expense)
}
const plannerPaymentCreditCardName = (payment: ExpensePlannerPayment) => getCreditCard(payment.creditCardId)?.title ?? ''
const creditCardExpensePayments = (expense: PlannedExpense, card?: CreditCard) =>
  card
    ? state.expensePlannerPayments
        .filter((payment) => payment.plannedExpenseId === expense.id && payment.creditCardId === card.id)
        .sort((left, right) => compareDatesDesc(left.paidDate, right.paidDate))
    : []
const creditCardExpensePaid = (expense: PlannedExpense, card?: CreditCard) =>
  creditCardExpensePayments(expense, card).reduce((sum, payment) => sum + plannerPaymentInEur(payment), 0)
const creditCardMovementLabel = (kind: CreditCardPaymentRow['kind']) =>
  kind === 'income' ? 'Доход' : kind === 'transfer' ? 'Перевод' : 'Расход'
const creditCardMovementSeverity = (kind: CreditCardPaymentRow['kind']) =>
  kind === 'expense' ? 'danger' : kind === 'transfer' ? 'info' : 'success'
const creditCardMovementAmountClass = (kind: CreditCardPaymentRow['kind']) =>
  kind === 'expense' ? 'text-red-700' : kind === 'transfer' ? 'text-blue-700' : 'text-emerald-700'
const creditCardMovementTitleClass = (kind: CreditCardPaymentRow['kind']) =>
  kind === 'expense' ? 'text-red-800' : kind === 'transfer' ? 'text-blue-800' : 'text-emerald-800'
const openCreditCardPaymentRow = (row: CreditCardPaymentRow) => {
  if (row.transfer) {
    openEditCreditCardTransferDialog(row.transfer)
    return
  }

  if (row.source) {
    if (state.plannedExpenses.some((expense) => expense.id === row.source?.id)) {
      openPlannedExpense(row.source as PlannedExpense)
      return
    }
    if (state.plannedIncomes.some((income) => income.id === row.source?.id)) {
      openPlannedIncome(row.source as PlannedIncome)
      return
    }
  }

  if (row.kind === 'income') {
    if (!row.payment) return
    const income = getPlannedIncome((row.payment as IncomePlannerPayment).plannedIncomeId)
    if (income) openPlannedIncome(income)
    return
  }

  if (!row.payment) return
  const expense = getPlannedExpense((row.payment as ExpensePlannerPayment).plannedExpenseId)
  if (expense) openPlannedExpense(expense)
}
const creditCardRowClass = (card: CreditCard) =>
  card.id === selectedCreditCardId.value ? '!bg-blue-50 cursor-pointer' : 'cursor-pointer'
const applyPlannerPaymentCreditCharge = (payment: ExpensePlannerPayment, multiplier: 1 | -1) => {
  const card = getCreditCard(payment.creditCardId)
  if (!card) return
  card.debt = Math.max(0, card.debt + convertCurrency(payment.amount, payment.currency, card.currency) * multiplier)
}
const applyCreditCardTransferDebt = (transfer: CreditCardTransfer, multiplier: 1 | -1) => {
  const card = getCreditCard(transfer.creditCardId)
  if (!card) return
  card.debt = Math.max(0, card.debt - convertCurrency(transfer.amount, transfer.currency, card.currency) * multiplier)
}
const isCreditExpenseCategory = (categoryId: string) =>
  getPlannerCategory(categoryId)?.systemType === 'credit_principal' ||
  getPlannerCategory(categoryId)?.systemType === 'credit_interest'
const applyCreditPrincipalExpenseDebt = (expense: PlannedExpense, multiplier: 1 | -1) => {
  if (!isCreditPrincipalExpense(expense)) return
  const card = getCreditCard(expense.creditCardId)
  if (!card) return
  card.debt = Math.max(0, card.debt - convertCurrency(expense.amount, expense.currency, card.currency) * multiplier)
}
const isCreditInterestExpense = (expense: PlannedExpense) =>
  getPlannerCategory(expense.categoryId)?.systemType === 'credit_interest'
const creditCardInterestPaid = (card: CreditCard) => {
  const interestExpenses = state.plannedExpenses.filter(
    (expense) => expense.creditCardId === card.id && isCreditInterestExpense(expense)
  )
  return interestExpenses.reduce((sum, expense) => {
    const paid = state.expensePlannerPayments
      .filter((payment) => payment.plannedExpenseId === expense.id)
      .reduce((paymentSum, payment) => paymentSum + convertCurrency(payment.amount, payment.currency, card.currency), 0)
    return sum + paid
  }, 0)
}
const plannedExpenseTitle = (expense: PlannedExpense) =>
  expense.title || getPlannerCategory(expense.categoryId)?.name || 'Без названия'
const plannedExpenseComment = (expense: PlannedExpense) => expense.notes.trim()
const plannedExpenseCreditCardName = (expense: PlannedExpense) => getCreditCard(expense.creditCardId)?.title ?? ''
const statusLabel = (value: DealStatus) => dealStatuses.find((status) => status.value === value)?.label ?? value
const paymentStatusLabel = (value: PaymentStatus) =>
  paymentStatuses.find((status) => status.value === value)?.label ?? value
const expenseCategoryLabel = (value: ExpenseCategory) =>
  expenseCategories.find((category) => category.value === value)?.label ?? value
const recurringLabel = (value: RecurringMode) =>
  recurringModes.find((mode) => mode.value === value)?.label ?? value

watch(selectedNav, (key) => {
  if (key !== 'planner') lastOrdersNav.value = key
})

watch(selectedMonth, () => {
  selectedPlannerWeekStart.value = ''
})

watch(
  () => plannedExpenseForm.categoryId,
  (categoryId) => {
    if (!isCreditExpenseCategory(categoryId)) plannedExpenseForm.creditCardId = ''
  }
)

watch(
  () => creditCardTransferForm.creditCardId,
  (cardId) => {
    if (editingCreditCardTransferId.value) return
    const card = getCreditCard(cardId)
    if (card) creditCardTransferForm.currency = card.currency
  }
)

const dealFinancials = (deal: Deal): DealFinancials => {
  const payments = state.payments.filter((payment) => payment.dealId === deal.id && payment.status !== 'cancelled')
  const paid = payments
    .filter((payment) => payment.status === 'received')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const overdue = payments
    .filter((payment) => isOverduePayment(payment))
    .reduce((sum, payment) => sum + payment.amount, 0)
  const expected = payments
    .filter((payment) => isUnpaid(payment) && !isOverduePayment(payment))
    .reduce((sum, payment) => sum + payment.amount, 0)
  const unpaid = payments
    .filter((payment) => isUnpaid(payment))
    .reduce((sum, payment) => sum + payment.amount, 0)
  const progress = deal.amount > 0 ? Math.min(100, Math.round((paid / deal.amount) * 100)) : 0
  const derivedStatus =
    overdue > 0 ? 'Есть просрочка' : paid >= deal.amount ? 'Оплачено' : paid > 0 ? 'Частично оплачено' : 'Нет оплат'

  return { paid, unpaid, overdue, expected, progress, derivedStatus }
}

const clientFinancials = (client: Client) => {
  const deals = clientDealsForMonth(client)
  const total = deals.reduce((sum, deal) => sum + deal.amount, 0)
  const paid = deals.reduce((sum, deal) => sum + dealFinancials(deal).paid, 0)
  const debt = deals.reduce((sum, deal) => sum + dealFinancials(deal).unpaid, 0)

  return { total, paid, debt, deals: deals.length }
}

const openNav = (key: NavKey) => {
  selectedNav.value = key
  if (key !== 'planner') {
    selectedPlannedExpenseId.value = ''
    selectedPlannedIncomeId.value = ''
    selectedPlannerWeekStart.value = ''
    plannerView.value = 'overview'
  }
}

const openWorkspace = (key: WorkspaceKey) => {
  openNav(key === 'planner' ? 'planner' : lastOrdersNav.value)
}

const openClient = (client: Client) => {
  selectedNav.value = 'clients'
  selectedClientId.value = client.id
  selectedDealId.value = ''
}

const openDeal = (deal: Deal) => {
  selectedNav.value = 'clients'
  selectedClientId.value = deal.clientId
  selectedDealId.value = deal.id
  selectedPlannedExpenseId.value = ''
  selectedPlannedIncomeId.value = ''
  selectedPlannerWeekStart.value = ''
}

const openPlannedExpense = (expense: PlannedExpense) => {
  selectedNav.value = 'planner'
  plannerView.value = 'overview'
  selectedPlannedExpenseId.value = expense.id
  selectedPlannedIncomeId.value = ''
  selectedPlannerWeekStart.value = ''
}

const openPlannedIncome = (income: PlannedIncome) => {
  selectedNav.value = 'planner'
  plannerView.value = 'overview'
  selectedPlannedIncomeId.value = income.id
  selectedPlannedExpenseId.value = ''
  selectedPlannerWeekStart.value = ''
}

const selectCreditCard = (card: CreditCard) => {
  selectedCreditCardId.value = selectedCreditCardId.value === card.id ? '' : card.id
}

const openPlannerWeek = (week: CashForecastWeek) => {
  selectedNav.value = 'planner'
  plannerView.value = 'overview'
  selectedPlannerWeekStart.value = week.startDate
  selectedPlannedExpenseId.value = ''
  selectedPlannedIncomeId.value = ''
}

const backToClients = () => {
  selectedClientId.value = ''
  selectedDealId.value = ''
  selectedNav.value = 'clients'
}

const backToClient = () => {
  selectedDealId.value = ''
  selectedNav.value = 'clients'
}

const backToPlannedExpenses = () => {
  selectedPlannedExpenseId.value = ''
  selectedPlannedIncomeId.value = ''
  selectedPlannerWeekStart.value = ''
  plannerView.value = 'overview'
  selectedNav.value = 'planner'
}

const openPlannerCategories = () => {
  selectedNav.value = 'planner'
  selectedPlannedExpenseId.value = ''
  selectedPlannedIncomeId.value = ''
  selectedPlannerWeekStart.value = ''
  Object.assign(plannerCategoryForm, emptyPlannerCategory())
  Object.assign(incomePlannerCategoryForm, emptyIncomePlannerCategory())
  plannerView.value = 'categories'
}

const openPlannerCreditCards = () => {
  selectedNav.value = 'planner'
  selectedPlannedExpenseId.value = ''
  selectedPlannedIncomeId.value = ''
  selectedPlannerWeekStart.value = ''
  selectedCreditCardId.value = ''
  Object.assign(creditCardForm, emptyCreditCard())
  plannerView.value = 'creditCards'
}

const openPlannerExpensePayments = () => {
  selectedNav.value = 'planner'
  selectedPlannedExpenseId.value = ''
  selectedPlannedIncomeId.value = ''
  selectedPlannerWeekStart.value = ''
  plannerView.value = 'expensePayments'
}

const openClientDialog = () => {
  Object.assign(clientForm, emptyClient())
  isClientDialogVisible.value = true
}

const openDealDialog = () => {
  editingDealId.value = ''
  Object.assign(dealForm, emptyDeal())
  if (selectedClient.value) {
    dealForm.clientId = selectedClient.value.id
    dealForm.currency = selectedClient.value.defaultCurrency
  }
  isDealDialogVisible.value = true
}

const openEditDealDialog = (deal: Deal) => {
  editingDealId.value = deal.id
  Object.assign(dealForm, { ...deal, notes: [...deal.notes] })
  isDealDialogVisible.value = true
}

const openPaymentDialog = () => {
  editingPaymentId.value = ''
  Object.assign(paymentForm, emptyPayment())
  if (selectedDeal.value) {
    paymentForm.dealId = selectedDeal.value.id
    paymentForm.dueDate = selectedDeal.value.expectedPaymentDate || selectedDeal.value.dueDate || selectedMonthLastIso()
  }
  isPaymentDialogVisible.value = true
}

const openEditPaymentDialog = (payment: Payment) => {
  editingPaymentId.value = payment.id
  Object.assign(paymentForm, { ...payment })
  isPaymentDialogVisible.value = true
}

const openExpenseDialog = (dealId = '') => {
  Object.assign(expenseForm, emptyExpense())
  expenseForm.dealId = dealId
  isExpenseDialogVisible.value = true
}

const openPlannedExpenseDialog = () => {
  editingPlannedExpenseId.value = ''
  Object.assign(plannedExpenseForm, emptyPlannedExpense())
  if (selectedPlannerWeek.value) {
    plannedExpenseForm.plannedDate = selectedPlannerWeek.value.startDate
  }
  isPlannedExpenseDialogVisible.value = true
}

const openEditPlannedExpenseDialog = (expense: PlannedExpense) => {
  editingPlannedExpenseId.value = expense.id
  Object.assign(plannedExpenseForm, { ...expense })
  isPlannedExpenseDialogVisible.value = true
}

const openPlannerPaymentDialog = () => {
  if (!selectedPlannedExpense.value) return
  editingPlannerPaymentId.value = ''
  Object.assign(plannerPaymentForm, emptyPlannerPayment())
  plannerPaymentForm.plannedExpenseId = selectedPlannedExpense.value.id
  plannerPaymentForm.currency = selectedPlannedExpense.value.currency
  isPlannerPaymentDialogVisible.value = true
}

const openEditPlannerPaymentDialog = (payment: ExpensePlannerPayment) => {
  editingPlannerPaymentId.value = payment.id
  Object.assign(plannerPaymentForm, { ...payment })
  isPlannerPaymentDialogVisible.value = true
}

const openPlannedIncomeDialog = () => {
  editingPlannedIncomeId.value = ''
  Object.assign(plannedIncomeForm, emptyPlannedIncome())
  isPlannedIncomeDialogVisible.value = true
}

const openEditPlannedIncomeDialog = (income: PlannedIncome) => {
  editingPlannedIncomeId.value = income.id
  Object.assign(plannedIncomeForm, { ...income })
  isPlannedIncomeDialogVisible.value = true
}

const openIncomePlannerPaymentDialog = () => {
  if (!selectedPlannedIncome.value) return
  editingIncomePlannerPaymentId.value = ''
  Object.assign(incomePlannerPaymentForm, emptyIncomePlannerPayment())
  incomePlannerPaymentForm.plannedIncomeId = selectedPlannedIncome.value.id
  incomePlannerPaymentForm.currency = selectedPlannedIncome.value.currency
  isIncomePlannerPaymentDialogVisible.value = true
}

const openEditIncomePlannerPaymentDialog = (payment: IncomePlannerPayment) => {
  editingIncomePlannerPaymentId.value = payment.id
  Object.assign(incomePlannerPaymentForm, { ...payment })
  isIncomePlannerPaymentDialogVisible.value = true
}

const openMoneyDialog = () => {
  editingMoneyBalanceId.value = ''
  Object.assign(moneyBalanceForm, emptyMoneyBalance())
  isMoneyDialogVisible.value = true
}

const openEditMoneyDialog = (balance: MoneyBalance) => {
  editingMoneyBalanceId.value = balance.id
  Object.assign(moneyBalanceForm, { ...balance })
  isMoneyDialogVisible.value = true
}

const openCreditCardDialog = () => {
  editingCreditCardId.value = ''
  Object.assign(creditCardForm, emptyCreditCard())
  isCreditCardDialogVisible.value = true
}

const openEditCreditCardDialog = (card: CreditCard) => {
  editingCreditCardId.value = card.id
  Object.assign(creditCardForm, { ...card })
  isCreditCardDialogVisible.value = true
}

const openCreditCardTransferDialog = (card?: CreditCard) => {
  editingCreditCardTransferId.value = ''
  if (card) selectedCreditCardId.value = card.id
  Object.assign(creditCardTransferForm, emptyCreditCardTransfer())
  if (card) {
    creditCardTransferForm.creditCardId = card.id
    creditCardTransferForm.currency = card.currency
  }
  isCreditCardTransferDialogVisible.value = true
}

const openEditCreditCardTransferDialog = (transfer: CreditCardTransfer) => {
  editingCreditCardTransferId.value = transfer.id
  Object.assign(creditCardTransferForm, { ...transfer })
  isCreditCardTransferDialogVisible.value = true
}

const addClient = () => {
  if (!clientForm.name.trim()) return
  const client = { ...clientForm, id: id('client') }
  state.clients.unshift(client)
  selectedClientId.value = client.id
  selectedDealId.value = ''
  selectedNav.value = 'clients'
  Object.assign(clientForm, emptyClient())
  isClientDialogVisible.value = false
}

const submitDeal = () => {
  if (!dealForm.title.trim() || !dealForm.clientId) return

  if (editingDealId.value) {
    const dealIndex = state.deals.findIndex((deal) => deal.id === editingDealId.value)
    if (dealIndex === -1) return
    const existingDeal = state.deals[dealIndex]
    const deal = { ...dealForm, id: existingDeal.id, notes: existingDeal.notes }
    state.deals[dealIndex] = deal
    openDeal(deal)
  } else {
    const deal = { ...dealForm, id: id('deal'), notes: [] }
    state.deals.unshift(deal)
    openDeal(deal)
  }

  editingDealId.value = ''
  Object.assign(dealForm, emptyDeal())
  isDealDialogVisible.value = false
}

const submitPayment = () => {
  if (!paymentForm.dealId || paymentForm.amount <= 0) return

  if (editingPaymentId.value) {
    const paymentIndex = state.payments.findIndex((item) => item.id === editingPaymentId.value)
    if (paymentIndex === -1) return
    const existingPayment = state.payments[paymentIndex]
    state.payments[paymentIndex] = {
      ...existingPayment,
      dealId: paymentForm.dealId,
      amount: paymentForm.amount,
      dueDate: paymentForm.dueDate
    }
  } else {
    state.payments.unshift({
      ...paymentForm,
      id: id('payment'),
      paidDate: '',
      status: 'expected',
      type: 'milestone',
      method: '',
      invoice: ''
    })
  }

  editingPaymentId.value = ''
  Object.assign(paymentForm, emptyPayment())
  isPaymentDialogVisible.value = false
}

const addExpense = () => {
  if (!expenseForm.title.trim() || expenseForm.amount <= 0) return
  state.expenses.unshift({ ...expenseForm, id: id('expense') })
  Object.assign(expenseForm, emptyExpense())
  isExpenseDialogVisible.value = false
}

const submitPlannedExpense = () => {
  if (!plannedExpenseForm.title.trim() || plannedExpenseForm.amount <= 0) return
  if (isCreditExpenseCategory(plannedExpenseForm.categoryId) && !plannedExpenseForm.creditCardId) return

  const expense = {
    ...plannedExpenseForm,
    creditCardId: isCreditExpenseCategory(plannedExpenseForm.categoryId) ? plannedExpenseForm.creditCardId : '',
    id: editingPlannedExpenseId.value || id('planned-expense'),
    title: plannedExpenseForm.title.trim()
  }
  if (editingPlannedExpenseId.value) {
    const expenseIndex = state.plannedExpenses.findIndex((item) => item.id === editingPlannedExpenseId.value)
    if (expenseIndex === -1) return
    applyCreditPrincipalExpenseDebt(state.plannedExpenses[expenseIndex], -1)
    state.plannedExpenses[expenseIndex] = expense
  } else {
    state.plannedExpenses.unshift(expense)
  }
  applyCreditPrincipalExpenseDebt(expense, 1)

  openPlannedExpense(expense)
  editingPlannedExpenseId.value = ''
  Object.assign(plannedExpenseForm, emptyPlannedExpense())
  isPlannedExpenseDialogVisible.value = false
}

const submitPlannerPayment = () => {
  if (!plannerPaymentForm.plannedExpenseId || plannerPaymentForm.amount <= 0) return
  const payment = { ...plannerPaymentForm, id: editingPlannerPaymentId.value || id('planner-payment') }

  if (editingPlannerPaymentId.value) {
    const paymentIndex = state.expensePlannerPayments.findIndex((item) => item.id === editingPlannerPaymentId.value)
    if (paymentIndex === -1) return
    applyPlannerPaymentCreditCharge(state.expensePlannerPayments[paymentIndex], -1)
    state.expensePlannerPayments[paymentIndex] = payment
  } else {
    state.expensePlannerPayments.unshift(payment)
  }
  applyPlannerPaymentCreditCharge(payment, 1)

  editingPlannerPaymentId.value = ''
  Object.assign(plannerPaymentForm, emptyPlannerPayment())
  isPlannerPaymentDialogVisible.value = false
}

const addPlannerCategory = () => {
  const name = plannerCategoryForm.name.trim()
  if (!name) return
  state.expensePlannerCategories.push({ id: id('planner-category'), name })
  Object.assign(plannerCategoryForm, emptyPlannerCategory())
}

const startEditPlannerCategory = (category: ExpensePlannerCategory) => {
  if (category.systemType) return
  editingPlannerCategoryId.value = category.id
  editingPlannerCategoryName.value = category.name
}

const savePlannerCategoryName = (category: ExpensePlannerCategory) => {
  if (category.systemType) return
  const name = editingPlannerCategoryName.value.trim()
  if (!name) return
  category.name = name
  state.plannedExpenses = state.plannedExpenses.map((expense) =>
    expense.categoryId === category.id ? { ...expense, title: name } : expense
  )
  editingPlannerCategoryId.value = ''
  editingPlannerCategoryName.value = ''
}

const cancelEditPlannerCategory = () => {
  editingPlannerCategoryId.value = ''
  editingPlannerCategoryName.value = ''
}

const submitPlannedIncome = () => {
  if (!plannedIncomeForm.title.trim() || plannedIncomeForm.amount <= 0) return

  const income = { ...plannedIncomeForm, id: editingPlannedIncomeId.value || id('planned-income') }
  if (editingPlannedIncomeId.value) {
    const incomeIndex = state.plannedIncomes.findIndex((item) => item.id === editingPlannedIncomeId.value)
    if (incomeIndex === -1) return
    state.plannedIncomes[incomeIndex] = income
  } else {
    state.plannedIncomes.unshift(income)
  }

  openPlannedIncome(income)
  editingPlannedIncomeId.value = ''
  Object.assign(plannedIncomeForm, emptyPlannedIncome())
  isPlannedIncomeDialogVisible.value = false
}

const submitIncomePlannerPayment = () => {
  if (!incomePlannerPaymentForm.plannedIncomeId || incomePlannerPaymentForm.amount <= 0) return
  const payment = { ...incomePlannerPaymentForm, id: editingIncomePlannerPaymentId.value || id('income-planner-payment') }

  if (editingIncomePlannerPaymentId.value) {
    const paymentIndex = state.incomePlannerPayments.findIndex((item) => item.id === editingIncomePlannerPaymentId.value)
    if (paymentIndex === -1) return
    state.incomePlannerPayments[paymentIndex] = payment
  } else {
    state.incomePlannerPayments.unshift(payment)
  }

  editingIncomePlannerPaymentId.value = ''
  Object.assign(incomePlannerPaymentForm, emptyIncomePlannerPayment())
  isIncomePlannerPaymentDialogVisible.value = false
}

const addIncomePlannerCategory = () => {
  const name = incomePlannerCategoryForm.name.trim()
  if (!name) return
  state.incomePlannerCategories.push({ id: id('income-planner-category'), name })
  Object.assign(incomePlannerCategoryForm, emptyIncomePlannerCategory())
}

const startEditIncomePlannerCategory = (category: IncomePlannerCategory) => {
  editingIncomePlannerCategoryId.value = category.id
  editingIncomePlannerCategoryName.value = category.name
}

const saveIncomePlannerCategoryName = (category: IncomePlannerCategory) => {
  const name = editingIncomePlannerCategoryName.value.trim()
  if (!name) return
  category.name = name
  editingIncomePlannerCategoryId.value = ''
  editingIncomePlannerCategoryName.value = ''
}

const cancelEditIncomePlannerCategory = () => {
  editingIncomePlannerCategoryId.value = ''
  editingIncomePlannerCategoryName.value = ''
}

const submitMoneyBalance = () => {
  if (!moneyBalanceForm.title.trim() || moneyBalanceForm.amount <= 0) return
  const balance = { ...moneyBalanceForm, id: editingMoneyBalanceId.value || id('money') }

  if (editingMoneyBalanceId.value) {
    const balanceIndex = state.moneyBalances.findIndex((item) => item.id === editingMoneyBalanceId.value)
    if (balanceIndex === -1) return
    state.moneyBalances[balanceIndex] = balance
  } else {
    state.moneyBalances.unshift(balance)
  }

  editingMoneyBalanceId.value = ''
  Object.assign(moneyBalanceForm, emptyMoneyBalance())
  isMoneyDialogVisible.value = false
}

const submitCreditCard = () => {
  if (!creditCardForm.title.trim() || creditCardForm.creditLimit < 0 || creditCardForm.debt < 0) return
  const card = { ...creditCardForm, id: editingCreditCardId.value || id('credit-card') }

  if (editingCreditCardId.value) {
    const cardIndex = state.creditCards.findIndex((item) => item.id === editingCreditCardId.value)
    if (cardIndex === -1) return
    state.creditCards[cardIndex] = card
  } else {
    state.creditCards.unshift(card)
  }

  selectedCreditCardId.value = card.id
  editingCreditCardId.value = ''
  Object.assign(creditCardForm, emptyCreditCard())
  isCreditCardDialogVisible.value = false
}

const submitCreditCardTransfer = () => {
  if (!creditCardTransferForm.creditCardId || creditCardTransferForm.amount <= 0) return
  const transfer = { ...creditCardTransferForm, id: editingCreditCardTransferId.value || id('credit-card-transfer') }

  if (editingCreditCardTransferId.value) {
    const transferIndex = state.creditCardTransfers.findIndex((item) => item.id === editingCreditCardTransferId.value)
    if (transferIndex === -1) return
    applyCreditCardTransferDebt(state.creditCardTransfers[transferIndex], -1)
    state.creditCardTransfers[transferIndex] = transfer
  } else {
    state.creditCardTransfers.unshift(transfer)
  }
  applyCreditCardTransferDebt(transfer, 1)

  selectedCreditCardId.value = transfer.creditCardId
  editingCreditCardTransferId.value = ''
  Object.assign(creditCardTransferForm, emptyCreditCardTransfer())
  isCreditCardTransferDialogVisible.value = false
}

const addNote = () => {
  if (!selectedDeal.value || !noteText.value.trim()) return
  selectedDeal.value.notes.unshift({
    id: id('note'),
    createdAt: new Date().toISOString(),
    text: noteText.value.trim()
  })
  noteText.value = ''
}

const markPaymentReceived = (payment: Payment) => {
  payment.status = 'received'
  payment.paidDate = todayIso
}

const removeClient = (client: Client) => {
  const relatedDeals = state.deals.filter((deal) => deal.clientId === client.id).map((deal) => deal.id)
  state.clients = state.clients.filter((item) => item.id !== client.id)
  state.deals = state.deals.filter((deal) => deal.clientId !== client.id)
  state.payments = state.payments.filter((payment) => !relatedDeals.includes(payment.dealId))
  state.expenses = state.expenses.filter((expense) => !relatedDeals.includes(expense.dealId))
  if (selectedClientId.value === client.id) backToClients()
}

const removeDeal = (deal: Deal) => {
  state.deals = state.deals.filter((item) => item.id !== deal.id)
  state.payments = state.payments.filter((payment) => payment.dealId !== deal.id)
  state.expenses = state.expenses.map((expense) =>
    expense.dealId === deal.id ? { ...expense, dealId: '' } : expense
  )
  if (selectedDealId.value === deal.id) {
    selectedDealId.value = ''
    selectedClientId.value = deal.clientId
  }
}

const removePayment = (payment: Payment) => {
  state.payments = state.payments.filter((item) => item.id !== payment.id)
}

const removeExpense = (expense: Expense) => {
  state.expenses = state.expenses.filter((item) => item.id !== expense.id)
}

const removePlannedExpense = (expense: PlannedExpense) => {
  applyCreditPrincipalExpenseDebt(expense, -1)
  state.expensePlannerPayments
    .filter((payment) => payment.plannedExpenseId === expense.id)
    .forEach((payment) => applyPlannerPaymentCreditCharge(payment, -1))
  state.plannedExpenses = state.plannedExpenses.filter((item) => item.id !== expense.id)
  state.expensePlannerPayments = state.expensePlannerPayments.filter(
    (payment) => payment.plannedExpenseId !== expense.id
  )
  if (selectedPlannedExpenseId.value === expense.id) backToPlannedExpenses()
}

const removePlannerPayment = (payment: ExpensePlannerPayment) => {
  applyPlannerPaymentCreditCharge(payment, -1)
  state.expensePlannerPayments = state.expensePlannerPayments.filter((item) => item.id !== payment.id)
}

const removePlannerCategory = (category: ExpensePlannerCategory) => {
  if (category.systemType) return
  state.expensePlannerCategories = state.expensePlannerCategories.map((item) =>
    item.id === category.id ? { ...item, deletedAt: new Date().toISOString() } : item
  )
}

const removePlannedIncome = (income: PlannedIncome) => {
  state.plannedIncomes = state.plannedIncomes.filter((item) => item.id !== income.id)
  state.incomePlannerPayments = state.incomePlannerPayments.filter(
    (payment) => payment.plannedIncomeId !== income.id
  )
  if (selectedPlannedIncomeId.value === income.id) backToPlannedExpenses()
}

const removeIncomePlannerPayment = (payment: IncomePlannerPayment) => {
  state.incomePlannerPayments = state.incomePlannerPayments.filter((item) => item.id !== payment.id)
}

const removeIncomePlannerCategory = (category: IncomePlannerCategory) => {
  state.incomePlannerCategories = state.incomePlannerCategories.map((item) =>
    item.id === category.id ? { ...item, deletedAt: new Date().toISOString() } : item
  )
}

const removeMoneyBalance = (balance: MoneyBalance) => {
  state.moneyBalances = state.moneyBalances.filter((item) => item.id !== balance.id)
}

const removeCreditCardTransfer = (transfer: CreditCardTransfer) => {
  applyCreditCardTransferDebt(transfer, -1)
  state.creditCardTransfers = state.creditCardTransfers.filter((item) => item.id !== transfer.id)
}

const removeCreditCard = (card: CreditCard) => {
  state.creditCards = state.creditCards.filter((item) => item.id !== card.id)
  if (selectedCreditCardId.value === card.id) selectedCreditCardId.value = ''
  state.creditCardTransfers = state.creditCardTransfers.filter((transfer) => transfer.creditCardId !== card.id)
  state.plannedExpenses = state.plannedExpenses.map((expense) =>
    expense.creditCardId === card.id ? { ...expense, creditCardId: '' } : expense
  )
  state.expensePlannerPayments = state.expensePlannerPayments.map((payment) =>
    payment.creditCardId === card.id ? { ...payment, creditCardId: '' } : payment
  )
}

const removeNote = (note: DealNote) => {
  if (!selectedDeal.value) return
  selectedDeal.value.notes = selectedDeal.value.notes.filter((item) => item.id !== note.id)
}

const saveState = async () => {
  saveStatus.value = 'Сохранение'
  try {
    await $fetch('/api/state', {
      method: 'PUT',
      body: toRaw(state)
    })
    saveStatus.value = 'Сохранено'
  } catch {
    saveStatus.value = 'Ошибка сохранения'
  }
}

if (import.meta.client) {
  watch(
    state,
    () => {
      saveStatus.value = 'Есть изменения'
      if (saveTimer.value) clearTimeout(saveTimer.value)
      saveTimer.value = setTimeout(() => {
        void saveState()
      }, 600)
    },
    { deep: true }
  )
}
</script>

<template>
  <main class="app-shell min-h-screen bg-[#f6f7f9]">
    <div class="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <section class="min-w-0 flex-1">
        <header class="mb-4 space-y-4 border-b border-slate-200 pb-4">
          <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div class="min-w-0">
              <div class="text-sm font-semibold uppercase tracking-wide text-slate-500">My Orders</div>
              <h1 class="mt-1 break-words text-xl font-semibold text-slate-950 sm:text-2xl">{{ pageTitle }}</h1>
              <p class="mt-1 text-sm text-slate-500">{{ pageSubtitle }}</p>
            </div>

            <div class="flex w-full flex-wrap items-center gap-2 xl:w-auto">
              <div class="flex w-full flex-col gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 sm:w-auto sm:flex-row sm:items-center">
                <span class="text-sm font-medium text-slate-600">Месяц учета</span>
                <InputText v-model="selectedMonth" class="h-9 w-full sm:h-8 sm:w-36" type="month" />
              </div>
              <Tag :severity="saveStatus === 'Ошибка сохранения' ? 'danger' : 'secondary'" :value="saveStatus" />
              <Button class="w-full sm:w-auto" icon="pi pi-save" label="Сохранить" severity="contrast" size="small" @click="saveState" />
            </div>
          </div>

          <nav class="grid gap-2 sm:grid-cols-2" aria-label="Разделы приложения">
            <button
              v-for="item in workspaceItems"
              :key="item.key"
              class="flex min-h-16 items-center gap-3 rounded-md border px-4 py-3 text-left transition"
              :class="selectedWorkspace === item.key ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950'"
              type="button"
              @click="openWorkspace(item.key)"
            >
              <i :class="[item.icon, 'text-xl']" />
              <span class="min-w-0">
                <span class="block text-sm font-semibold">{{ item.label }}</span>
                <span class="block text-xs" :class="selectedWorkspace === item.key ? 'text-slate-300' : 'text-slate-500'">
                  {{ item.key === 'orders' ? 'Клиенты, заказы и платежи' : 'Доходы, расходы и деньги' }}
                </span>
              </span>
            </button>
          </nav>

          <nav v-if="selectedWorkspace === 'orders'" class="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap" aria-label="Навигация базы заказов">
            <button
              v-for="item in ordersNavItems"
              :key="item.key"
              class="flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium transition sm:justify-start sm:px-3"
              :class="selectedNav === item.key ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
              type="button"
              @click="openNav(item.key)"
            >
              <i :class="item.icon" />
              <span>{{ item.label }}</span>
            </button>
          </nav>
        </header>

        <Message v-if="error" severity="error" :closable="false" class="mb-4">
          Не удалось загрузить данные с Nuxt API.
        </Message>

        <div v-if="pending" class="py-20 text-center text-slate-500">Загрузка данных...</div>

        <template v-else>
          <section v-if="selectedNav === 'dashboard'" class="space-y-5">
            <Message v-if="ratesError" severity="warn" :closable="false">
              Курсы НБУ сейчас недоступны, суммы в разных валютах могут отображаться без конвертации.
            </Message>

            <div v-else-if="exchangeRates" class="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <span class="font-medium text-slate-950">Курсы НБУ на {{ exchangeRates.exchangedate }}</span>
              <Tag :value="`EUR ${money(exchangeRates.rates.EUR, 'UAH')}`" severity="secondary" />
              <Tag :value="`USD ${money(exchangeRates.rates.USD, 'UAH')}`" severity="secondary" />
              <Tag :value="`USDT ${money(exchangeRates.rates.USDT, 'UAH')}`" severity="secondary" />
            </div>

            <div>
              <h2 class="text-lg font-semibold text-slate-950">Дашборд за {{ selectedMonthLabel }}</h2>
              <div class="mt-1 text-sm text-slate-500">Все суммы считаются по месяцу плановой даты поступления платежа.</div>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Клиенты</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ metrics.clients }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Заказы</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ metrics.deals }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Сумма заказов, EUR</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(metrics.orderAmount, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">План платежей, EUR</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(metrics.plannedRevenue, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Получено, EUR</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(metrics.received, 'EUR') }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ metrics.receivedPayments }} платежей</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Ожидается, EUR</div>
                <div class="mt-2 text-2xl font-semibold text-emerald-700">{{ money(metrics.expected, 'EUR') }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ metrics.expectedPayments }} платежей</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Просрочено, EUR</div>
                <div class="mt-2 text-2xl font-semibold text-red-700">{{ money(metrics.overdue, 'EUR') }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ metrics.overduePayments }} платежей</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Плановая прибыль, EUR</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(metrics.plannedProfit, 'EUR') }}</div>
              </div>
            </div>

            <div class="grid gap-5 xl:grid-cols-2">
              <div>
                <h2 class="mb-3 text-lg font-semibold text-slate-950">Заказы месяца</h2>
                <DataTable :value="monthDeals" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
                  <Column header="Клиент">
                    <template #body="{ data: deal }">
                      <button v-if="getClient(deal.clientId)" class="text-left font-medium text-slate-950 hover:underline" type="button" @click="openClient(getClient(deal.clientId)!)">
                        {{ getClient(deal.clientId)?.name }}
                      </button>
                      <span v-else class="text-sm text-slate-500">Клиент не найден</span>
                    </template>
                  </Column>
                  <Column header="Заказ">
                    <template #body="{ data: deal }">
                      <button class="text-left font-medium text-slate-950 hover:underline" type="button" @click="openDeal(deal)">
                        {{ deal.title }}
                      </button>
                      <div class="text-sm text-slate-500">{{ deal.dueDate }} · {{ statusLabel(deal.status) }}</div>
                    </template>
                  </Column>
                  <Column header="Сумма">
                    <template #body="{ data: deal }">{{ money(deal.amount, deal.currency) }}</template>
                  </Column>
                  <Column header="Оплачено">
                    <template #body="{ data: deal }">{{ money(dealFinancials(deal).paid, deal.currency) }}</template>
                  </Column>
                  <template #empty>
                    <div class="p-4 text-sm text-slate-500">В выбранном месяце заказов пока нет.</div>
                  </template>
                </DataTable>
              </div>

              <div>
                <h2 class="mb-3 text-lg font-semibold text-slate-950">Платежи месяца</h2>
                <DataTable :value="monthDashboardPayments" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
                  <Column header="Заказ">
                    <template #body="{ data: payment }">
                      <button v-if="getDeal(payment.dealId)" class="text-left font-medium text-slate-950 hover:underline" type="button" @click="openDeal(getDeal(payment.dealId)!)">
                        {{ getDeal(payment.dealId)?.title }}
                      </button>
                      <div class="text-sm text-slate-500">{{ getClient(getDeal(payment.dealId)?.clientId ?? '')?.name ?? 'Клиент не найден' }}</div>
                    </template>
                  </Column>
                  <Column header="Сумма">
                    <template #body="{ data: payment }">{{ money(payment.amount, paymentCurrency(payment)) }}</template>
                  </Column>
                  <Column header="Дата">
                    <template #body="{ data: payment }">
                      <div class="text-sm">План: {{ payment.dueDate }}</div>
                      <div class="text-sm text-slate-500">Факт: {{ payment.paidDate || '—' }}</div>
                    </template>
                  </Column>
                  <Column header="Статус">
                    <template #body="{ data: payment }">
                      <Tag :severity="isOverduePayment(payment) ? 'danger' : payment.status === 'received' ? 'success' : 'secondary'" :value="isOverduePayment(payment) ? 'Просрочен' : paymentStatusLabel(payment.status)" />
                    </template>
                  </Column>
                  <Column header="">
                    <template #body="{ data: payment }">
                      <Button v-if="payment.status !== 'received'" icon="pi pi-check" label="Подтвердить" severity="success" size="small" @click="markPaymentReceived(payment)" />
                    </template>
                  </Column>
                  <template #empty>
                    <div class="p-4 text-sm text-slate-500">В выбранном месяце платежей пока нет.</div>
                  </template>
                </DataTable>
              </div>
            </div>
          </section>

          <section v-if="selectedNav === 'clients' && !selectedClient && !selectedDeal" class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Таблица клиентов</h2>
                <div class="text-sm text-slate-500">Период учета: {{ selectedMonthLabel }}</div>
              </div>
              <div class="flex flex-col gap-2 sm:flex-row">
                <InputText v-model="clientSearch" class="w-full sm:w-80" placeholder="Поиск клиента" />
                <Button icon="pi pi-plus" label="Создать клиента" severity="contrast" @click="openClientDialog" />
              </div>
            </div>

            <DataTable :value="filteredClients" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
              <Column header="Клиент">
                <template #body="{ data: client }">
                  <button class="text-left font-medium text-slate-950 hover:underline" type="button" @click="openClient(client)">
                    {{ client.name }}
                  </button>
                  <div class="text-sm text-slate-500">{{ client.contact || 'Без контакта' }}</div>
                </template>
              </Column>
              <Column header="Тип">
                <template #body="{ data: client }">
                  <Tag :value="client.type === 'regular' ? 'Постоянный' : 'Разовый'" />
                </template>
              </Column>
              <Column header="Заказы">
                <template #body="{ data: client }">{{ clientFinancials(client).deals }}</template>
              </Column>
              <Column header="Оплачено">
                <template #body="{ data: client }">{{ money(clientFinancials(client).paid, client.defaultCurrency) }}</template>
              </Column>
              <Column header="Долг">
                <template #body="{ data: client }">{{ money(clientFinancials(client).debt, client.defaultCurrency) }}</template>
              </Column>
              <Column header="">
                <template #body="{ data: client }">
                  <Button icon="pi pi-trash" severity="secondary" text rounded @click="removeClient(client)" />
                </template>
              </Column>
            </DataTable>
          </section>

          <section v-if="selectedNav === 'clients' && selectedClient && !selectedDeal" class="space-y-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button icon="pi pi-arrow-left" label="К клиентам" severity="secondary" @click="backToClients" />
              <Button icon="pi pi-plus" :label="`Добавить заказ в ${selectedMonthLabel}`" severity="contrast" @click="openDealDialog" />
            </div>

            <div class="grid gap-3 md:grid-cols-4">
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Сумма заказов за месяц</div>
                <div class="mt-2 text-xl font-semibold">{{ money(clientFinancials(selectedClient).total, selectedClient.defaultCurrency) }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Оплачено за месяц</div>
                <div class="mt-2 text-xl font-semibold text-emerald-700">{{ money(clientFinancials(selectedClient).paid, selectedClient.defaultCurrency) }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Долг за месяц</div>
                <div class="mt-2 text-xl font-semibold text-amber-700">{{ money(clientFinancials(selectedClient).debt, selectedClient.defaultCurrency) }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Заказы за месяц</div>
                <div class="mt-2 text-xl font-semibold">{{ clientFinancials(selectedClient).deals }}</div>
              </div>
            </div>

            <h2 class="text-lg font-semibold text-slate-950">Заказы клиента</h2>
            <DataTable :value="clientDeals" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
              <Column header="Заказ">
                <template #body="{ data: deal }">
                  <button class="text-left font-medium text-slate-950 hover:underline" type="button" @click="openDeal(deal)">
                    {{ deal.title }}
                  </button>
                  <div class="text-sm text-slate-500">{{ deal.dueDate }} · {{ statusLabel(deal.status) }}</div>
                </template>
              </Column>
              <Column header="Сумма">
                <template #body="{ data: deal }">{{ money(deal.amount, deal.currency) }}</template>
              </Column>
              <Column header="Оплачено">
                <template #body="{ data: deal }">
                  <div class="min-w-40">
                    <div class="mb-1 flex justify-between text-sm">
                      <span>{{ money(dealFinancials(deal).paid, deal.currency) }}</span>
                      <span>{{ dealFinancials(deal).progress }}%</span>
                    </div>
                    <ProgressBar :value="dealFinancials(deal).progress" :show-value="false" class="h-2" />
                  </div>
                </template>
              </Column>
              <Column header="Осталось">
                <template #body="{ data: deal }">{{ money(dealFinancials(deal).unpaid, deal.currency) }}</template>
              </Column>
              <Column header="">
                <template #body="{ data: deal }">
                  <div class="flex justify-end gap-1">
                    <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditDealDialog(deal)" />
                    <Button icon="pi pi-trash" severity="secondary" text rounded @click="removeDeal(deal)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </section>

          <section v-if="selectedNav === 'clients' && selectedDeal" class="space-y-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-arrow-left" label="К заказам клиента" severity="secondary" @click="backToClient" />
                <Button icon="pi pi-users" label="К клиентам" severity="secondary" @click="backToClients" />
              </div>
              <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-pencil" label="Редактировать заказ" severity="secondary" @click="openEditDealDialog(selectedDeal)" />
                <Button icon="pi pi-plus" label="Добавить платеж" severity="contrast" @click="openPaymentDialog" />
                <Button icon="pi pi-receipt" label="Добавить расход" severity="secondary" @click="openExpenseDialog(selectedDeal.id)" />
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-4">
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Сумма заказа</div>
                <div class="mt-2 text-xl font-semibold">{{ money(selectedDeal.amount, selectedDeal.currency) }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Оплачено</div>
                <div class="mt-2 text-xl font-semibold text-emerald-700">{{ money(dealFinancials(selectedDeal).paid, selectedDeal.currency) }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Осталось</div>
                <div class="mt-2 text-xl font-semibold text-amber-700">{{ money(dealFinancials(selectedDeal).unpaid, selectedDeal.currency) }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Статус оплаты</div>
                <div class="mt-2 text-xl font-semibold">{{ dealFinancials(selectedDeal).derivedStatus }}</div>
              </div>
            </div>

            <h2 class="text-lg font-semibold text-slate-950">Платежи по заказу</h2>
            <div class="grid gap-5 xl:grid-cols-[1fr_380px]">
              <DataTable :value="orderPayments" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
                <Column header="Платеж">
                  <template #body="{ data: payment }">
                    <div class="font-medium text-slate-950">{{ paymentTypes.find((type) => type.value === payment.type)?.label }}</div>
                    <div class="text-sm text-slate-500">{{ payment.invoice || payment.method || 'Без реквизитов' }}</div>
                  </template>
                </Column>
                <Column header="Сумма">
                  <template #body="{ data: payment }">{{ money(payment.amount, selectedDeal.currency) }}</template>
                </Column>
                <Column header="Дата">
                  <template #body="{ data: payment }">
                    <div class="text-sm">План: {{ payment.dueDate }}</div>
                    <div class="text-sm text-slate-500">Факт: {{ payment.paidDate || '—' }}</div>
                    <div class="text-xs text-slate-500">Месяц учета: {{ paymentAccountingMonth(payment) }}</div>
                  </template>
                </Column>
                <Column header="Статус">
                  <template #body="{ data: payment }">
                    <Tag :severity="isOverduePayment(payment) ? 'danger' : payment.status === 'received' ? 'success' : 'secondary'" :value="isOverduePayment(payment) ? 'Просрочен' : paymentStatusLabel(payment.status)" />
                  </template>
                </Column>
                <Column header="">
                  <template #body="{ data: payment }">
                    <div class="flex justify-end gap-1">
                      <Button v-if="payment.status !== 'received'" icon="pi pi-check" label="Подтвердить платеж" severity="success" size="small" @click="markPaymentReceived(payment)" />
                      <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditPaymentDialog(payment)" />
                      <Button icon="pi pi-trash" severity="secondary" text rounded @click="removePayment(payment)" />
                    </div>
                  </template>
                </Column>
              </DataTable>

              <div class="space-y-5">
                <div class="rounded-md border border-slate-200 bg-white p-4">
                  <h2 class="mb-4 text-lg font-semibold text-slate-950">Заметки</h2>
                  <Textarea v-model="noteText" class="mb-2 w-full" rows="4" placeholder="Новая заметка" />
                  <Button class="mb-4 w-full" icon="pi pi-comment" label="Добавить заметку" @click="addNote" />
                  <div class="space-y-3">
                    <div v-for="note in selectedDeal.notes" :key="note.id" class="rounded-md border border-slate-200 p-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <span class="text-xs text-slate-500">{{ new Date(note.createdAt).toLocaleString('ru-RU') }}</span>
                        <Button icon="pi pi-times" severity="secondary" text rounded size="small" @click="removeNote(note)" />
                      </div>
                      <p class="whitespace-pre-wrap text-sm text-slate-800">{{ note.text }}</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-md border border-slate-200 bg-white p-4">
                  <h2 class="mb-3 text-lg font-semibold text-slate-950">Расходы заказа</h2>
                  <div class="space-y-3">
                    <div
                      v-for="expense in selectedDealExpenses"
                      :key="expense.id"
                      class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div class="min-w-0">
                        <div class="truncate text-sm font-medium text-slate-950">{{ expense.title }}</div>
                        <div class="text-xs text-slate-500">{{ expense.date }} · {{ expenseCategoryLabel(expense.category) }}</div>
                      </div>
                      <div class="shrink-0 text-sm font-semibold">{{ money(expense.amount, selectedDeal.currency) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-if="selectedNav === 'planner' && plannerView === 'overview' && !selectedPlannedExpense && !selectedPlannedIncome && !selectedPlannerWeek" class="space-y-5">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div class="grid w-full gap-2 sm:grid-cols-2 xl:w-[560px]">
                <InputText v-model="plannedIncomeSearch" class="w-full" placeholder="Поиск дохода или категории" />
                <InputText v-model="plannedExpenseSearch" class="w-full" placeholder="Поиск расхода или категории" />
              </div>
              <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-tags" label="Категории" severity="secondary" @click="openPlannerCategories" />
                <Button icon="pi pi-list" label="Платежи расходов" severity="secondary" @click="openPlannerExpensePayments" />
                <Button icon="pi pi-wallet" label="Добавить деньги" severity="secondary" @click="openMoneyDialog" />
                <Button icon="pi pi-credit-card" label="Карты" severity="secondary" @click="openPlannerCreditCards" />
                <Button icon="pi pi-plus" label="Добавить доход" severity="success" @click="openPlannedIncomeDialog" />
                <Button icon="pi pi-plus" label="Добавить расход" severity="contrast" @click="openPlannedExpenseDialog" />
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Доступно сейчас</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(plannerMetrics.cashBalance, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">План доходов за месяц</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(plannerMetrics.plannedIncomeMonth, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Факт доходов за месяц</div>
                <div class="mt-2 text-2xl font-semibold text-emerald-700">{{ money(plannerMetrics.receivedIncomeMonth, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">План расходов за месяц</div>
                <div class="mt-2 text-2xl font-semibold text-amber-700">{{ money(plannerMetrics.plannedMonth, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Факт расходов за месяц</div>
                <div class="mt-2 text-2xl font-semibold text-emerald-700">{{ money(plannerMetrics.paidMonth, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Свободно после плана</div>
                <div class="mt-2 text-2xl font-semibold" :class="plannerMetrics.freeAfterPlan < 0 ? 'text-red-700' : 'text-slate-950'">
                  {{ money(plannerMetrics.freeAfterPlan, 'EUR') }}
                </div>
              </div>
            </div>

            <div class="rounded-md border border-slate-200 bg-white p-4">
              <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-slate-950">План по неделям</h2>
                  <div class="mt-1 text-sm text-slate-500">Расходы выбранного месяца по неделям, EUR</div>
                </div>
                <Tag
                  :severity="weeklyCashGapRows.length ? 'danger' : 'success'"
                  :value="weeklyCashGapRows.length ? `Разрывы: ${weeklyCashGapRows.length}` : 'Без разрывов'"
                />
              </div>

              <DataTable
                :value="weeklyCashForecast"
                responsive-layout="scroll"
                class="overflow-hidden rounded-md border border-slate-200"
              >
                <Column header="Неделя">
                  <template #body="{ data: week }">
                    <button class="text-left font-semibold text-slate-950 hover:underline" type="button" @click="openPlannerWeek(week)">
                      Неделя {{ week.week }}
                    </button>
                    <div class="text-sm text-slate-500">{{ week.label }}</div>
                  </template>
                </Column>
                <Column header="План">
                  <template #body="{ data: week }">
                    <div class="font-semibold text-red-700">{{ money(week.planned, 'EUR') }}</div>
                    <div class="text-xs text-slate-500">{{ week.count }} поз.</div>
                  </template>
                </Column>
                <Column header="Факт">
                  <template #body="{ data: week }">
                    <span class="font-semibold text-slate-950">{{ money(week.paid, 'EUR') }}</span>
                  </template>
                </Column>
                <Column header="Осталось">
                  <template #body="{ data: week }">
                    <span v-if="hasMoneyOverrun(week.overrun)" class="font-semibold text-red-700">- {{ money(week.overrun, 'EUR') }}</span>
                    <span v-else class="font-semibold text-emerald-700">{{ money(week.remaining, 'EUR') }}</span>
                  </template>
                </Column>
                <Column header="Разрыв">
                  <template #body="{ data: week }">
                    <div v-if="week.gapDays" class="font-semibold text-red-700">{{ money(week.gapAmount, 'EUR') }}</div>
                    <div v-else class="font-medium text-emerald-700">{{ money(0, 'EUR') }}</div>
                    <div class="text-xs text-slate-500">{{ week.gapDays ? `${week.gapDays} дн.` : 'нет' }}</div>
                  </template>
                </Column>
                <Column header="">
                  <template #body="{ data: week }">
                    <div class="flex justify-end">
                      <Button icon="pi pi-folder-open" label="Открыть" severity="secondary" size="small" @click="openPlannerWeek(week)" />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>

            <div>
              <h2 class="mb-3 text-lg font-semibold text-slate-950">Доходы</h2>
              <DataTable :value="filteredPlannedIncomes" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
                <Column header="Доход">
                  <template #body="{ data: income }">
                    <button class="text-left font-medium text-slate-950 hover:underline" type="button" @click="openPlannedIncome(income)">
                      {{ income.title }}
                    </button>
                    <div class="text-sm text-slate-500">{{ getIncomePlannerCategory(income.categoryId)?.name ?? 'Без категории' }}</div>
                  </template>
                </Column>
                <Column header="План">
                  <template #body="{ data: income }">{{ money(plannedIncomeInEur(income), 'EUR') }}</template>
                </Column>
                <Column header="Факт">
                  <template #body="{ data: income }">{{ money(toEur(plannerIncomeFinancials(income).paid, income.currency), 'EUR') }}</template>
                </Column>
                <Column header="Осталось">
                  <template #body="{ data: income }">{{ money(toEur(plannerIncomeFinancials(income).remaining, income.currency), 'EUR') }}</template>
                </Column>
                <Column field="plannedDate" header="Плановая дата" />
                <Column header="">
                  <template #body="{ data: income }">
                    <div class="flex justify-end gap-1">
                      <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditPlannedIncomeDialog(income)" />
                      <Button icon="pi pi-trash" severity="secondary" text rounded @click="removePlannedIncome(income)" />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>

            <div class="grid gap-5 xl:grid-cols-2">
              <div>
                <h2 class="mb-3 text-lg font-semibold text-slate-950">Доходы по месяцам</h2>
                <DataTable :value="incomePlannerMonthRows" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
                  <Column field="month" header="Месяц" />
                  <Column header="План">
                    <template #body="{ data: row }">{{ money(row.planned, 'EUR') }}</template>
                  </Column>
                  <Column header="Факт">
                    <template #body="{ data: row }">{{ money(row.paid, 'EUR') }}</template>
                  </Column>
                  <Column header="Осталось">
                    <template #body="{ data: row }">{{ money(row.remaining, 'EUR') }}</template>
                  </Column>
                </DataTable>
              </div>

              <div>
                <h2 class="mb-3 text-lg font-semibold text-slate-950">Расходы по месяцам</h2>
                <DataTable :value="plannerMonthRows" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
                  <Column field="month" header="Месяц" />
                  <Column header="План">
                    <template #body="{ data: row }">{{ money(row.planned, 'EUR') }}</template>
                  </Column>
                  <Column header="Факт">
                    <template #body="{ data: row }">{{ money(row.paid, 'EUR') }}</template>
                  </Column>
                  <Column header="Осталось">
                    <template #body="{ data: row }">{{ money(row.remaining, 'EUR') }}</template>
                  </Column>
                </DataTable>
              </div>
            </div>
          </section>

          <section v-if="selectedNav === 'planner' && plannerView === 'expensePayments'" class="space-y-5">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Button icon="pi pi-arrow-left" label="К планировщику" severity="secondary" @click="backToPlannedExpenses" />
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-md border border-slate-200 bg-white px-4 py-3">
                  <div class="text-sm text-slate-500">Платежей</div>
                  <div class="mt-1 text-xl font-semibold text-slate-950">{{ expensePaymentRows.length }}</div>
                </div>
                <div class="rounded-md border border-slate-200 bg-white px-4 py-3">
                  <div class="text-sm text-slate-500">Всего факт</div>
                  <div class="mt-1 text-xl font-semibold text-slate-950">{{ money(expensePaymentRowsTotal, 'EUR') }}</div>
                </div>
              </div>
            </div>

            <DataTable :value="expensePaymentRows" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
              <Column header="Факт дата платежа">
                <template #body="{ data: row }">
                  <div class="font-medium text-slate-950">{{ row.payment.paidDate || '—' }}</div>
                </template>
              </Column>
              <Column header="Расход">
                <template #body="{ data: row }">
                  <button
                    v-if="row.expense"
                    class="text-left font-medium text-slate-950 hover:underline"
                    type="button"
                    @click="openPlannedExpense(row.expense)"
                  >
                    {{ plannedExpenseTitle(row.expense) }}
                  </button>
                  <div v-else class="font-medium text-slate-500">Расход не найден</div>
                  <div class="text-sm text-slate-500">{{ row.category?.name ?? 'Без категории' }}</div>
                </template>
              </Column>
              <Column header="Сумма">
                <template #body="{ data: row }">
                  <div class="font-semibold text-slate-950">{{ money(plannerPaymentInEur(row.payment), 'EUR') }}</div>
                  <div class="text-xs text-slate-500">{{ money(row.payment.amount, row.payment.currency) }}</div>
                </template>
              </Column>
              <Column header="Карта">
                <template #body="{ data: row }">
                  <span>{{ row.creditCard?.title ?? '—' }}</span>
                </template>
              </Column>
              <Column header="Заметка">
                <template #body="{ data: row }">
                  <div class="max-w-md whitespace-pre-wrap text-sm text-slate-600">{{ row.payment.notes || '—' }}</div>
                </template>
              </Column>
              <Column header="">
                <template #body="{ data: row }">
                  <div class="flex justify-end gap-1">
                    <Button icon="pi pi-folder-open" severity="secondary" text rounded :disabled="!row.expense" @click="openPlannedExpense(row.expense)" />
                    <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditPlannerPaymentDialog(row.payment)" />
                    <Button icon="pi pi-trash" severity="secondary" text rounded @click="removePlannerPayment(row.payment)" />
                  </div>
                </template>
              </Column>
              <template #empty>
                <div class="p-4 text-sm text-slate-500">Фактических платежей по расходам пока нет.</div>
              </template>
            </DataTable>
          </section>

          <section v-if="selectedNav === 'planner' && plannerView === 'creditCards'" class="space-y-5">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Button icon="pi pi-arrow-left" label="К планировщику" severity="secondary" @click="backToPlannedExpenses" />
              <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-send" label="Перевод на карту" severity="secondary" :disabled="!state.creditCards.length" @click="openCreditCardTransferDialog(selectedCreditCard)" />
                <Button icon="pi pi-plus" label="Добавить карту" severity="secondary" @click="openCreditCardDialog" />
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Кредит</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(totalCreditLimit, 'EUR') }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ money(toUah(totalCreditLimit, 'EUR'), 'UAH') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Задолженность</div>
                <div class="mt-2 text-2xl font-semibold text-red-700">{{ money(totalCreditDebt, 'EUR') }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ money(toUah(totalCreditDebt, 'EUR'), 'UAH') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Доступно</div>
                <div class="mt-2 text-2xl font-semibold" :class="totalCreditAvailable < 0 ? 'text-red-700' : 'text-emerald-700'">
                  {{ money(totalCreditAvailable, 'EUR') }}
                </div>
                <div class="mt-1 text-sm text-slate-500">{{ money(toUah(totalCreditAvailable, 'EUR'), 'UAH') }}</div>
              </div>
            </div>

            <DataTable
              :value="state.creditCards"
              data-key="id"
              responsive-layout="scroll"
              class="overflow-hidden rounded-md border border-slate-200"
              :row-class="creditCardRowClass"
              @row-click="selectCreditCard($event.data)"
            >
              <Column header="Карта">
                <template #body="{ data: card }">
                  <div class="font-medium text-slate-950">{{ card.title }}</div>
                  <div v-if="card.notes" class="text-sm text-slate-500">{{ card.notes }}</div>
                </template>
              </Column>
              <Column header="Кредит">
                <template #body="{ data: card }">
                  <div>{{ money(toEur(card.creditLimit, card.currency), 'EUR') }}</div>
                  <div class="text-xs text-slate-500">{{ money(toUah(card.creditLimit, card.currency), 'UAH') }}</div>
                </template>
              </Column>
              <Column header="Задолженность">
                <template #body="{ data: card }">
                  <div class="font-semibold text-red-700">{{ money(toEur(card.debt, card.currency), 'EUR') }}</div>
                  <div class="text-xs text-slate-500">{{ money(toUah(card.debt, card.currency), 'UAH') }}</div>
                </template>
              </Column>
              <Column header="Оплачено процентов">
                <template #body="{ data: card }">
                  <div class="font-semibold text-slate-950">{{ money(toEur(creditCardInterestPaid(card), card.currency), 'EUR') }}</div>
                  <div class="text-xs text-slate-500">{{ money(toUah(creditCardInterestPaid(card), card.currency), 'UAH') }}</div>
                </template>
              </Column>
              <Column header="Доступно">
                <template #body="{ data: card }">
                  <div class="font-semibold" :class="creditCardAvailable(card) < 0 ? 'text-red-700' : 'text-emerald-700'">
                    {{ money(toEur(creditCardAvailable(card), card.currency), 'EUR') }}
                  </div>
                  <div class="text-xs text-slate-500">{{ money(toUah(creditCardAvailable(card), card.currency), 'UAH') }}</div>
                </template>
              </Column>
              <Column header="">
                <template #body="{ data: card }">
                  <div class="flex justify-end gap-1">
                    <Button icon="pi pi-pencil" severity="secondary" text rounded @click.stop="openEditCreditCardDialog(card)" />
                    <Button icon="pi pi-trash" severity="secondary" text rounded @click.stop="removeCreditCard(card)" />
                  </div>
                </template>
              </Column>
              <template #empty>
                <div class="p-4 text-sm text-slate-500">Кредитных карт пока нет.</div>
              </template>
            </DataTable>

            <div v-if="selectedCreditCard" class="rounded-md border border-slate-200 bg-white p-4">
              <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-slate-950">Движения по карте {{ selectedCreditCard.title }}</h2>
                  <div class="mt-1 text-sm text-slate-500">
                    {{ selectedCreditCardPaymentRows.length }} платежей · расходы {{ money(selectedCreditCardPaid, 'EUR') }} · доходы {{ money(selectedCreditCardIncomePaid, 'EUR') }} · переводы {{ money(selectedCreditCardTransferPaid, 'EUR') }}
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button icon="pi pi-send" label="Перевод" severity="secondary" size="small" @click="openCreditCardTransferDialog(selectedCreditCard)" />
                  <Button icon="pi pi-times" label="Скрыть" severity="secondary" size="small" @click="selectedCreditCardId = ''" />
                </div>
              </div>

              <DataTable :value="selectedCreditCardPaymentRows" data-key="id" responsive-layout="scroll" class="mb-4 overflow-hidden rounded-md border border-slate-200">
                <Column header="Факт дата">
                  <template #body="{ data: row }">
                    <div class="font-medium text-slate-950">{{ row.paidDate || '—' }}</div>
                  </template>
                </Column>
                <Column header="Тип">
                  <template #body="{ data: row }">
                    <Tag :severity="creditCardMovementSeverity(row.kind)" :value="creditCardMovementLabel(row.kind)" />
                  </template>
                </Column>
                <Column header="Платеж">
                  <template #body="{ data: row }">
                    <button
                      v-if="row.source"
                      class="text-left font-medium hover:underline"
                      :class="creditCardMovementTitleClass(row.kind)"
                      type="button"
                      @click="openCreditCardPaymentRow(row)"
                    >
                      {{ row.title }}
                    </button>
                    <button
                      v-else-if="row.transfer"
                      class="text-left font-medium hover:underline"
                      :class="creditCardMovementTitleClass(row.kind)"
                      type="button"
                      @click="openEditCreditCardTransferDialog(row.transfer)"
                    >
                      {{ row.title }}
                    </button>
                    <div v-else class="font-medium" :class="creditCardMovementTitleClass(row.kind)">{{ row.title }}</div>
                    <div class="text-sm text-slate-500">{{ row.categoryName }}</div>
                  </template>
                </Column>
                <Column header="Сумма">
                  <template #body="{ data: row }">
                    <div class="font-semibold" :class="creditCardMovementAmountClass(row.kind)">
                      {{ row.kind === 'expense' ? '-' : '+' }} {{ money(toEur(row.amount, row.currency), 'EUR') }}
                    </div>
                    <div class="text-xs text-slate-500">{{ money(row.amount, row.currency) }}</div>
                  </template>
                </Column>
                <Column header="Заметка">
                  <template #body="{ data: row }">
                    <div class="max-w-md whitespace-pre-wrap text-sm text-slate-600">{{ row.notes || '—' }}</div>
                  </template>
                </Column>
                <Column header="">
                  <template #body="{ data: row }">
                    <div v-if="row.transfer" class="flex justify-end gap-1">
                      <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditCreditCardTransferDialog(row.transfer)" />
                      <Button icon="pi pi-trash" severity="secondary" text rounded @click="removeCreditCardTransfer(row.transfer)" />
                    </div>
                  </template>
                </Column>
                <template #empty>
                  <div class="p-4 text-sm text-slate-500">По этой карте пока нет платежей.</div>
                </template>
              </DataTable>

              <h3 class="mb-3 text-sm font-semibold uppercase text-slate-500">Плановые расходы этой карты</h3>
              <DataTable :value="selectedCreditCardExpenses" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200" :row-class="plannedExpenseRowClass">
                <Column header="Расход">
                  <template #body="{ data: expense }">
                    <button
                      class="text-left font-medium hover:underline"
                      :class="hasMoneyOverrun(plannerExpenseFinancials(expense).overrun) ? 'text-red-900' : 'text-slate-950'"
                      type="button"
                      @click="openPlannedExpense(expense)"
                    >
                      {{ plannedExpenseTitle(expense) }}
                    </button>
                    <div class="text-sm" :class="hasMoneyOverrun(plannerExpenseFinancials(expense).overrun) ? 'text-red-700' : 'text-slate-500'">
                      {{ getPlannerCategory(expense.categoryId)?.name ?? 'Без категории' }}
                    </div>
                  </template>
                </Column>
                <Column header="План">
                  <template #body="{ data: expense }">{{ money(plannedExpenseInEur(expense), 'EUR') }}</template>
                </Column>
                <Column header="Оплачено этой картой">
                  <template #body="{ data: expense }">
                    <div class="font-semibold text-slate-950">{{ money(creditCardExpensePaid(expense, selectedCreditCard), 'EUR') }}</div>
                    <div v-if="creditCardExpensePayments(expense, selectedCreditCard).length" class="text-xs text-slate-500">
                      {{ creditCardExpensePayments(expense, selectedCreditCard).map((payment) => `${shortDate(payment.paidDate)} ${money(toEur(payment.amount, payment.currency), 'EUR')}`).join(', ') }}
                    </div>
                    <div v-else class="text-xs text-slate-500">Платежей пока нет</div>
                  </template>
                </Column>
                <Column header="Всего факт">
                  <template #body="{ data: expense }">{{ money(toEur(plannerExpenseFinancials(expense).paid, expense.currency), 'EUR') }}</template>
                </Column>
                <Column field="plannedDate" header="Плановая дата" />
                <Column header="">
                  <template #body="{ data: expense }">
                    <div class="flex justify-end">
                      <Button icon="pi pi-folder-open" label="Открыть" severity="secondary" size="small" @click="openPlannedExpense(expense)" />
                    </div>
                  </template>
                </Column>
                <template #empty>
                  <div class="p-4 text-sm text-slate-500">С этой карты пока нет расходов.</div>
                </template>
              </DataTable>
            </div>
          </section>

          <section v-if="selectedNav === 'planner' && plannerView === 'overview' && selectedPlannerWeek" class="space-y-5">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Button icon="pi pi-arrow-left" label="К планировщику" severity="secondary" @click="backToPlannedExpenses" />
              <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-plus" label="Добавить расход в неделю" severity="contrast" @click="openPlannedExpenseDialog" />
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Период</div>
                <div class="mt-2 text-xl font-semibold text-slate-950">{{ selectedPlannerWeek.label }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">План</div>
                <div class="mt-2 text-2xl font-semibold text-red-700">{{ money(selectedPlannerWeek.planned, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Факт</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950">{{ money(selectedPlannerWeek.paid, 'EUR') }}</div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">{{ hasMoneyOverrun(selectedPlannerWeek.overrun) ? 'Перерасход' : 'Осталось' }}</div>
                <div class="mt-2 text-2xl font-semibold" :class="hasMoneyOverrun(selectedPlannerWeek.overrun) ? 'text-red-700' : 'text-emerald-700'">
                  {{ money(hasMoneyOverrun(selectedPlannerWeek.overrun) ? selectedPlannerWeek.overrun : selectedPlannerWeek.remaining, 'EUR') }}
                </div>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <div class="text-sm text-slate-500">Кассовый разрыв</div>
                <div class="mt-2 text-2xl font-semibold" :class="selectedPlannerWeek.gapAmount ? 'text-red-700' : 'text-emerald-700'">
                  {{ money(selectedPlannerWeek.gapAmount, 'EUR') }}
                </div>
                <div class="mt-1 text-sm text-slate-500">{{ selectedPlannerWeek.gapDays ? `${selectedPlannerWeek.gapDays} дн.` : 'нет' }}</div>
              </div>
            </div>

            <div>
              <h2 class="mb-3 text-lg font-semibold text-slate-950">Расходы недели</h2>
              <DataTable :value="selectedPlannerWeekExpenses" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200" :row-class="plannedExpenseRowClass">
                <Column header="Расход">
                  <template #body="{ data: expense }">
                    <button
                      class="text-left font-medium hover:underline"
                      :class="hasMoneyOverrun(plannerExpenseFinancials(expense).overrun) ? 'text-red-900' : 'text-slate-950'"
                      type="button"
                      @click="openPlannedExpense(expense)"
                    >
                      {{ plannedExpenseTitle(expense) }}
                    </button>
                    <div class="text-sm" :class="hasMoneyOverrun(plannerExpenseFinancials(expense).overrun) ? 'text-red-700' : 'text-slate-500'">
                      {{ plannedExpenseComment(expense) || 'Без комментария' }}
                    </div>
                    <div v-if="plannedExpenseCreditCardName(expense)" class="mt-1 text-xs text-slate-500">
                      {{ plannedExpenseCreditCardName(expense) }}
                    </div>
                  </template>
                </Column>
                <Column header="План">
                  <template #body="{ data: expense }">{{ money(plannedExpenseInEur(expense), 'EUR') }}</template>
                </Column>
                <Column header="Факт">
                  <template #body="{ data: expense }">
                    <span :class="hasMoneyOverrun(plannerExpenseFinancials(expense).overrun) ? 'font-semibold text-red-700' : ''">
                      {{ money(toEur(plannerExpenseFinancials(expense).paid, expense.currency), 'EUR') }}
                    </span>
                  </template>
                </Column>
                <Column header="Осталось">
                  <template #body="{ data: expense }">
                    <span v-if="hasMoneyOverrun(plannerExpenseFinancials(expense).overrun)" class="font-semibold text-red-700">
                      - {{ money(toEur(plannerExpenseFinancials(expense).overrun, expense.currency), 'EUR') }}
                    </span>
                    <span v-else class="text-green-700">{{ money(toEur(plannerExpenseFinancials(expense).remaining, expense.currency), 'EUR') }}</span>
                  </template>
                </Column>
                <Column field="plannedDate" header="Плановая дата" />
                <Column header="">
                  <template #body="{ data: expense }">
                    <div class="flex justify-end gap-1">
                      <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditPlannedExpenseDialog(expense)" />
                      <Button icon="pi pi-trash" severity="secondary" text rounded @click="removePlannedExpense(expense)" />
                    </div>
                  </template>
                </Column>
                <template #empty>
                  <div class="p-4 text-sm text-slate-500">В этой неделе пока нет плановых расходов.</div>
                </template>
              </DataTable>
            </div>
          </section>

          <section v-if="selectedNav === 'planner' && plannerView === 'categories'" class="space-y-5">
            <div class="flex justify-start">
              <Button icon="pi pi-arrow-left" label="К планировщику" severity="secondary" @click="backToPlannedExpenses" />
            </div>

            <div class="grid gap-5 xl:grid-cols-2">
              <div class="rounded-md border border-slate-200 bg-white p-4">
                <h2 class="mb-3 text-lg font-semibold text-slate-950">Категории доходов</h2>
                <form class="mb-4 flex flex-col gap-2 sm:flex-row" @submit.prevent="addIncomePlannerCategory">
                  <InputText v-model="incomePlannerCategoryForm.name" class="w-full" placeholder="Название категории" />
                  <Button icon="pi pi-plus" label="Добавить" type="submit" severity="success" />
                </form>
                <div class="space-y-2">
                  <div
                    v-for="category in activeIncomePlannerCategories"
                    :key="category.id"
                    class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 first:pt-0 last:border-0 last:pb-0"
                  >
                    <div class="min-w-0 flex-1">
                      <form v-if="editingIncomePlannerCategoryId === category.id" class="flex gap-2" @submit.prevent="saveIncomePlannerCategoryName(category)">
                        <InputText v-model="editingIncomePlannerCategoryName" class="w-full" placeholder="Название категории" />
                        <Button icon="pi pi-check" severity="success" text rounded type="submit" />
                        <Button icon="pi pi-times" severity="secondary" text rounded type="button" @click="cancelEditIncomePlannerCategory" />
                      </form>
                      <div v-else class="truncate text-sm font-medium text-slate-950">{{ category.name }}</div>
                      <div class="text-xs text-slate-500">
                        {{ state.plannedIncomes.filter((income) => income.categoryId === category.id).length }} доходов
                      </div>
                    </div>
                    <div v-if="editingIncomePlannerCategoryId !== category.id" class="flex shrink-0 justify-end gap-1">
                      <Button icon="pi pi-pencil" severity="secondary" text rounded @click="startEditIncomePlannerCategory(category)" />
                      <Button icon="pi pi-trash" severity="secondary" text rounded @click="removeIncomePlannerCategory(category)" />
                    </div>
                  </div>
                  <div v-if="!activeIncomePlannerCategories.length" class="text-sm text-slate-500">Категорий доходов пока нет.</div>
                </div>
              </div>

              <div class="rounded-md border border-slate-200 bg-white p-4">
                <h2 class="mb-3 text-lg font-semibold text-slate-950">Категории расходов</h2>
                <form class="mb-4 flex flex-col gap-2 sm:flex-row" @submit.prevent="addPlannerCategory">
                  <InputText v-model="plannerCategoryForm.name" class="w-full" placeholder="Название категории" />
                  <Button icon="pi pi-plus" label="Добавить" type="submit" />
                </form>
                <div class="space-y-2">
                  <div
                    v-for="category in activeExpensePlannerCategories"
                    :key="category.id"
                    class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 first:pt-0 last:border-0 last:pb-0"
                  >
                    <div class="min-w-0 flex-1">
                      <form v-if="editingPlannerCategoryId === category.id" class="flex gap-2" @submit.prevent="savePlannerCategoryName(category)">
                        <InputText v-model="editingPlannerCategoryName" class="w-full" placeholder="Название категории" />
                        <Button icon="pi pi-check" severity="success" text rounded type="submit" />
                        <Button icon="pi pi-times" severity="secondary" text rounded type="button" @click="cancelEditPlannerCategory" />
                      </form>
                      <div v-else class="truncate text-sm font-medium text-slate-950">{{ category.name }}</div>
                      <div class="text-xs text-slate-500">
                        {{ category.systemType ? 'Системная категория' : `${state.plannedExpenses.filter((expense) => expense.categoryId === category.id).length} расходов` }}
                      </div>
                    </div>
                    <div v-if="!category.systemType && editingPlannerCategoryId !== category.id" class="flex shrink-0 justify-end gap-1">
                      <Button icon="pi pi-pencil" severity="secondary" text rounded @click="startEditPlannerCategory(category)" />
                      <Button icon="pi pi-trash" severity="secondary" text rounded @click="removePlannerCategory(category)" />
                    </div>
                  </div>
                  <div v-if="!activeExpensePlannerCategories.length" class="text-sm text-slate-500">Категорий расходов пока нет.</div>
                </div>
              </div>
            </div>
          </section>

          <section v-if="selectedNav === 'planner' && selectedPlannedIncome" class="space-y-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button icon="pi pi-arrow-left" label="К планировщику" severity="secondary" @click="backToPlannedExpenses" />
              <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-pencil" label="Редактировать доход" severity="secondary" @click="openEditPlannedIncomeDialog(selectedPlannedIncome)" />
                <Button icon="pi pi-plus" label="Добавить платеж" severity="success" @click="openIncomePlannerPaymentDialog" />
              </div>
            </div>

            <div class="rounded-md border border-slate-200 bg-white p-4">
              <div class="grid gap-4 xl:grid-cols-[1fr_260px]">
                <div>
                  <div class="text-sm text-slate-500">{{ getIncomePlannerCategory(selectedPlannedIncome.categoryId)?.name ?? 'Без категории' }}</div>
                  <h2 class="mt-1 text-xl font-semibold text-slate-950">{{ selectedPlannedIncome.title }}</h2>
                  <p v-if="selectedPlannedIncome.notes" class="mt-3 whitespace-pre-wrap text-sm text-slate-700">{{ selectedPlannedIncome.notes }}</p>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">Плановая дата</span>
                    <b>{{ selectedPlannedIncome.plannedDate }}</b>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">План</span>
                    <b>{{ money(selectedPlannedIncome.amount, selectedPlannedIncome.currency) }}</b>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">Факт</span>
                    <b class="text-emerald-700">{{ money(plannerIncomeFinancials(selectedPlannedIncome).paid, selectedPlannedIncome.currency) }}</b>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">Осталось</span>
                    <b>{{ money(plannerIncomeFinancials(selectedPlannedIncome).remaining, selectedPlannedIncome.currency) }}</b>
                  </div>
                </div>
              </div>
              <ProgressBar :value="plannerIncomeFinancials(selectedPlannedIncome).progress" :show-value="false" class="mt-4 h-2" />
            </div>

            <DataTable :value="selectedIncomePlannerPayments" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
              <Column header="Платеж">
                <template #body="{ data: payment }">
                  <div class="font-medium text-slate-950">{{ money(incomePlannerPaymentInEur(payment), 'EUR') }}</div>
                </template>
              </Column>
              <Column field="paidDate" header="Факт дата платежа" />
              <Column header="Заметка">
                <template #body="{ data: payment }">
                  <Textarea v-model="payment.notes" class="w-full min-w-64" rows="2" auto-resize placeholder="Заметка к платежу" />
                </template>
              </Column>
              <Column header="">
                <template #body="{ data: payment }">
                  <div class="flex justify-end gap-1">
                    <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditIncomePlannerPaymentDialog(payment)" />
                    <Button icon="pi pi-trash" severity="secondary" text rounded @click="removeIncomePlannerPayment(payment)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </section>

          <section v-if="selectedNav === 'planner' && selectedPlannedExpense" class="space-y-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button icon="pi pi-arrow-left" label="К планировщику" severity="secondary" @click="backToPlannedExpenses" />
              <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-pencil" label="Редактировать расход" severity="secondary" @click="openEditPlannedExpenseDialog(selectedPlannedExpense)" />
                <Button icon="pi pi-plus" label="Добавить платеж" severity="contrast" @click="openPlannerPaymentDialog" />
              </div>
            </div>

            <div class="rounded-md border border-slate-200 bg-white p-4">
              <div class="grid gap-4 xl:grid-cols-[1fr_260px]">
                  <div>
                    <div class="text-sm text-slate-500">Категория</div>
                    <h2 class="mt-1 text-xl font-semibold text-slate-950">{{ plannedExpenseTitle(selectedPlannedExpense) }}</h2>
                    <div v-if="plannedExpenseCreditCardName(selectedPlannedExpense)" class="mt-2 text-sm text-slate-500">
                      Кредитная карта: {{ plannedExpenseCreditCardName(selectedPlannedExpense) }}
                    </div>
                    <p v-if="plannedExpenseComment(selectedPlannedExpense)" class="mt-3 whitespace-pre-wrap text-sm text-slate-700">{{ plannedExpenseComment(selectedPlannedExpense) }}</p>
                  </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">Плановая дата</span>
                    <b>{{ selectedPlannedExpense.plannedDate }}</b>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">План</span>
                    <b>{{ money(selectedPlannedExpense.amount, selectedPlannedExpense.currency) }}</b>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">Факт</span>
                    <b :class="hasMoneyOverrun(plannerExpenseFinancials(selectedPlannedExpense).overrun) ? 'text-red-700' : 'text-emerald-700'">
                      {{ money(plannerExpenseFinancials(selectedPlannedExpense).paid, selectedPlannedExpense.currency) }}
                    </b>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-slate-500">{{ hasMoneyOverrun(plannerExpenseFinancials(selectedPlannedExpense).overrun) ? 'Перерасход' : 'Осталось' }}</span>
                    <b :class="hasMoneyOverrun(plannerExpenseFinancials(selectedPlannedExpense).overrun) ? 'text-red-700' : ''">
                      {{
                        money(
                          hasMoneyOverrun(plannerExpenseFinancials(selectedPlannedExpense).overrun)
                            ? plannerExpenseFinancials(selectedPlannedExpense).overrun
                            : plannerExpenseFinancials(selectedPlannedExpense).remaining,
                          selectedPlannedExpense.currency
                        )
                      }}
                    </b>
                  </div>
                </div>
              </div>
              <ProgressBar :value="plannerExpenseFinancials(selectedPlannedExpense).progress" :show-value="false" class="mt-4 h-2" />
            </div>

            <DataTable :value="selectedPlannerPayments" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
              <Column header="Платеж">
                <template #body="{ data: payment }">
                  <div class="font-medium text-slate-950">{{ money(plannerPaymentInEur(payment), 'EUR') }}</div>
                  <div v-if="plannerPaymentCreditCardName(payment)" class="mt-1 text-xs text-slate-500">
                    Кредитная карта: {{ plannerPaymentCreditCardName(payment) }}
                  </div>
                </template>
              </Column>
              <Column field="paidDate" header="Факт дата платежа" />
              <Column header="Заметка">
                <template #body="{ data: payment }">
                  <Textarea v-model="payment.notes" class="w-full min-w-64" rows="2" auto-resize placeholder="Заметка к платежу" />
                </template>
              </Column>
              <Column header="">
                <template #body="{ data: payment }">
                  <div class="flex justify-end gap-1">
                    <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditPlannerPaymentDialog(payment)" />
                    <Button icon="pi pi-trash" severity="secondary" text rounded @click="removePlannerPayment(payment)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </section>

          <section v-if="selectedNav === 'expenses'" class="space-y-4">
            <div class="flex justify-end">
              <Button icon="pi pi-plus" label="Добавить расход" severity="contrast" @click="openExpenseDialog()" />
            </div>

            <DataTable :value="state.expenses" data-key="id" responsive-layout="scroll" class="overflow-hidden rounded-md border border-slate-200">
              <Column header="Расход">
                <template #body="{ data: expense }">
                  <div class="font-medium text-slate-950">{{ expense.title }}</div>
                  <button v-if="expense.dealId && getDeal(expense.dealId)" class="text-sm text-slate-500 hover:underline" type="button" @click="openDeal(getDeal(expense.dealId)!)">
                    {{ getDeal(expense.dealId)?.title }}
                  </button>
                </template>
              </Column>
              <Column header="Категория">
                <template #body="{ data: expense }">{{ expenseCategoryLabel(expense.category) }}</template>
              </Column>
              <Column header="Сумма">
                <template #body="{ data: expense }">{{ money(expense.amount) }}</template>
              </Column>
              <Column field="date" header="Дата" />
              <Column header="Повтор">
                <template #body="{ data: expense }">{{ recurringLabel(expense.recurring) }}</template>
              </Column>
              <Column header="">
                <template #body="{ data: expense }">
                  <Button icon="pi pi-trash" severity="secondary" text rounded @click="removeExpense(expense)" />
                </template>
              </Column>
            </DataTable>
          </section>
        </template>
      </section>
    </div>

    <Dialog v-model:visible="isClientDialogVisible" modal header="Новый клиент" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="addClient">
        <InputText v-model="clientForm.name" class="w-full" placeholder="Название или имя" />
        <Select v-model="clientForm.type" class="w-full" :options="clientTypes" option-label="label" option-value="value" />
        <InputText v-model="clientForm.contact" class="w-full" placeholder="Контакт" />
        <Select v-model="clientForm.defaultCurrency" class="w-full" :options="currencies" />
        <InputText v-model="clientForm.paymentTerms" class="w-full" placeholder="Условия оплаты" />
        <Textarea v-model="clientForm.notes" class="w-full" rows="4" placeholder="Заметки по клиенту" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isClientDialogVisible = false" />
          <Button icon="pi pi-plus" label="Создать клиента" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isDealDialogVisible" modal :header="editingDealId ? 'Редактировать заказ' : 'Новый заказ'" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitDeal">
        <Select v-model="dealForm.clientId" class="w-full" :options="clientOptions" option-label="label" option-value="value" placeholder="Клиент" />
        <InputText v-model="dealForm.title" class="w-full" placeholder="Название заказа" />
        <div class="grid gap-2 sm:grid-cols-2">
          <InputNumber v-model="dealForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Сумма" />
          <Select v-model="dealForm.currency" class="w-full" :options="currencies" />
        </div>
        <Select v-model="dealForm.status" class="w-full" :options="dealStatuses" option-label="label" option-value="value" />
        <div class="grid gap-2 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm text-slate-500">Старт заказа</label>
            <InputText v-model="dealForm.startDate" class="w-full" type="date" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-500">Срок заказа</label>
            <InputText v-model="dealForm.dueDate" class="w-full" type="date" />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-500">Плановая дата поступления</label>
          <InputText v-model="dealForm.expectedPaymentDate" class="w-full" type="date" />
        </div>
        <div>
          <label class="mb-2 block text-sm text-slate-500">Вероятность оплаты: {{ dealForm.probability }}%</label>
          <Slider v-model="dealForm.probability" :min="0" :max="100" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isDealDialogVisible = false" />
          <Button :icon="editingDealId ? 'pi pi-check' : 'pi pi-plus'" :label="editingDealId ? 'Сохранить заказ' : 'Добавить заказ'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isPaymentDialogVisible" modal :header="editingPaymentId ? 'Редактировать платеж' : 'Новый платеж'" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitPayment">
        <Select v-model="paymentForm.dealId" class="w-full" :options="dealOptions" option-label="label" option-value="value" placeholder="Заказ" />
        <InputNumber v-model="paymentForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Сумма" />
        <div>
          <label class="mb-1 block text-sm text-slate-500">Плановая дата поступления</label>
          <InputText v-model="paymentForm.dueDate" class="w-full" type="date" />
        </div>
        <Message severity="secondary" :closable="false">
          Факт дата поступления записывается автоматически при подтверждении платежа.
        </Message>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isPaymentDialogVisible = false" />
          <Button :icon="editingPaymentId ? 'pi pi-check' : 'pi pi-plus'" :label="editingPaymentId ? 'Сохранить платеж' : 'Добавить платеж'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isExpenseDialogVisible" modal header="Новый расход" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="addExpense">
        <InputText v-model="expenseForm.title" class="w-full" placeholder="Название расхода" />
        <InputNumber v-model="expenseForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Сумма" />
        <Select v-model="expenseForm.category" class="w-full" :options="expenseCategories" option-label="label" option-value="value" />
        <InputText v-model="expenseForm.date" class="w-full" type="date" />
        <Select v-model="expenseForm.recurring" class="w-full" :options="recurringModes" option-label="label" option-value="value" />
        <Select v-model="expenseForm.dealId" class="w-full" :options="[{ label: 'Без привязки', value: '' }, ...dealOptions]" option-label="label" option-value="value" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isExpenseDialogVisible = false" />
          <Button icon="pi pi-plus" label="Добавить расход" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isPlannedExpenseDialogVisible" modal :header="editingPlannedExpenseId ? 'Редактировать плановый расход' : 'Новый плановый расход'" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitPlannedExpense">
        <InputText v-model="plannedExpenseForm.title" class="w-full" placeholder="Название расхода" />
        <Select v-model="plannedExpenseForm.categoryId" class="w-full" :options="plannerCategoryOptions" option-label="label" option-value="value" placeholder="Категория расхода" />
        <Select
          v-if="isCreditExpenseCategory(plannedExpenseForm.categoryId)"
          v-model="plannedExpenseForm.creditCardId"
          class="w-full"
          :options="creditCardOptions"
          option-label="label"
          option-value="value"
          placeholder="Кредитная карта"
        />
        <div class="grid gap-2 sm:grid-cols-2">
          <InputNumber v-model="plannedExpenseForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Плановая сумма" />
          <Select v-model="plannedExpenseForm.currency" class="w-full" :options="currencies" />
        </div>
        <InputText v-model="plannedExpenseForm.plannedDate" class="w-full" type="date" />
        <Textarea v-model="plannedExpenseForm.notes" class="w-full" rows="4" placeholder="Заметки" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isPlannedExpenseDialogVisible = false" />
          <Button :icon="editingPlannedExpenseId ? 'pi pi-check' : 'pi pi-plus'" :label="editingPlannedExpenseId ? 'Сохранить расход' : 'Добавить расход'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isCreditCardDialogVisible" modal :header="editingCreditCardId ? 'Редактировать кредитную карту' : 'Новая кредитная карта'" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitCreditCard">
        <InputText v-model="creditCardForm.title" class="w-full" placeholder="Название карты" />
        <div class="grid gap-2 sm:grid-cols-[1fr_1fr_120px]">
          <InputNumber v-model="creditCardForm.creditLimit" class="w-full" input-class="w-full" :min="0" placeholder="Кредит" />
          <InputNumber v-model="creditCardForm.debt" class="w-full" input-class="w-full" :min="0" placeholder="Задолженность" />
          <Select v-model="creditCardForm.currency" class="w-full" :options="currencies" />
        </div>
        <Textarea v-model="creditCardForm.notes" class="w-full" rows="3" auto-resize placeholder="Заметка" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isCreditCardDialogVisible = false" />
          <Button :icon="editingCreditCardId ? 'pi pi-check' : 'pi pi-plus'" :label="editingCreditCardId ? 'Сохранить карту' : 'Добавить карту'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isPlannedIncomeDialogVisible" modal :header="editingPlannedIncomeId ? 'Редактировать плановый доход' : 'Новый плановый доход'" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitPlannedIncome">
        <InputText v-model="plannedIncomeForm.title" class="w-full" placeholder="Название дохода" />
        <Select v-model="plannedIncomeForm.categoryId" class="w-full" :options="incomePlannerCategoryOptions" option-label="label" option-value="value" />
        <div class="grid gap-2 sm:grid-cols-2">
          <InputNumber v-model="plannedIncomeForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Плановая сумма" />
          <Select v-model="plannedIncomeForm.currency" class="w-full" :options="currencies" />
        </div>
        <InputText v-model="plannedIncomeForm.plannedDate" class="w-full" type="date" />
        <Textarea v-model="plannedIncomeForm.notes" class="w-full" rows="4" placeholder="Заметки" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isPlannedIncomeDialogVisible = false" />
          <Button :icon="editingPlannedIncomeId ? 'pi pi-check' : 'pi pi-plus'" :label="editingPlannedIncomeId ? 'Сохранить доход' : 'Добавить доход'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isPlannerPaymentDialogVisible" modal :header="editingPlannerPaymentId ? 'Редактировать платеж по расходу' : 'Новый платеж по расходу'" :style="{ width: 'min(520px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitPlannerPayment">
        <div class="grid gap-2 sm:grid-cols-[1fr_120px]">
          <InputNumber v-model="plannerPaymentForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Сумма платежа" />
          <Select v-model="plannerPaymentForm.currency" class="w-full" :options="currencies" />
        </div>
        <Select
          v-model="plannerPaymentForm.creditCardId"
          class="w-full"
          :options="creditCardOptions"
          option-label="label"
          option-value="value"
          show-clear
          placeholder="Списать с кредитной карты"
        />
        <InputText v-model="plannerPaymentForm.paidDate" class="w-full" type="date" />
        <Textarea v-model="plannerPaymentForm.notes" class="w-full" rows="3" auto-resize placeholder="Заметка к платежу" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isPlannerPaymentDialogVisible = false" />
          <Button :icon="editingPlannerPaymentId ? 'pi pi-check' : 'pi pi-plus'" :label="editingPlannerPaymentId ? 'Сохранить платеж' : 'Добавить платеж'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isIncomePlannerPaymentDialogVisible" modal :header="editingIncomePlannerPaymentId ? 'Редактировать платеж по доходу' : 'Новый платеж по доходу'" :style="{ width: 'min(520px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitIncomePlannerPayment">
        <div class="grid gap-2 sm:grid-cols-[1fr_120px]">
          <InputNumber v-model="incomePlannerPaymentForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Сумма платежа" />
          <Select v-model="incomePlannerPaymentForm.currency" class="w-full" :options="currencies" />
        </div>
        <Select
          v-model="incomePlannerPaymentForm.creditCardId"
          class="w-full"
          :options="creditCardOptions"
          option-label="label"
          option-value="value"
          show-clear
          placeholder="Зачислить на кредитную карту"
        />
        <InputText v-model="incomePlannerPaymentForm.paidDate" class="w-full" type="date" />
        <Textarea v-model="incomePlannerPaymentForm.notes" class="w-full" rows="3" auto-resize placeholder="Заметка к платежу" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isIncomePlannerPaymentDialogVisible = false" />
          <Button :icon="editingIncomePlannerPaymentId ? 'pi pi-check' : 'pi pi-plus'" :label="editingIncomePlannerPaymentId ? 'Сохранить платеж' : 'Добавить платеж'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isCreditCardTransferDialogVisible" modal :header="editingCreditCardTransferId ? 'Редактировать перевод на карту' : 'Перевод на кредитную карту'" :style="{ width: 'min(520px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitCreditCardTransfer">
        <Select
          v-model="creditCardTransferForm.creditCardId"
          class="w-full"
          :options="creditCardOptions"
          option-label="label"
          option-value="value"
          placeholder="Кредитная карта"
        />
        <div class="grid gap-2 sm:grid-cols-[1fr_120px]">
          <InputNumber v-model="creditCardTransferForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Сумма перевода" />
          <Select v-model="creditCardTransferForm.currency" class="w-full" :options="currencies" />
        </div>
        <InputText v-model="creditCardTransferForm.paidDate" class="w-full" type="date" />
        <Textarea v-model="creditCardTransferForm.notes" class="w-full" rows="3" auto-resize placeholder="Заметка к переводу" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isCreditCardTransferDialogVisible = false" />
          <Button :icon="editingCreditCardTransferId ? 'pi pi-check' : 'pi pi-send'" :label="editingCreditCardTransferId ? 'Сохранить перевод' : 'Добавить перевод'" type="submit" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="isMoneyDialogVisible" modal :header="editingMoneyBalanceId ? 'Редактировать деньги' : 'Имеющиеся деньги'" :style="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="space-y-3 pt-1" @submit.prevent="submitMoneyBalance">
        <InputText v-model="moneyBalanceForm.title" class="w-full" placeholder="Название" />
        <div class="grid gap-2 sm:grid-cols-2">
          <InputNumber v-model="moneyBalanceForm.amount" class="w-full" input-class="w-full" :min="0" placeholder="Сумма" />
          <Select v-model="moneyBalanceForm.currency" class="w-full" :options="currencies" />
        </div>
        <InputText v-model="moneyBalanceForm.date" class="w-full" type="date" />
        <Textarea v-model="moneyBalanceForm.notes" class="w-full" rows="3" placeholder="Заметки" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Отмена" severity="secondary" type="button" @click="isMoneyDialogVisible = false" />
          <Button :icon="editingMoneyBalanceId ? 'pi pi-check' : 'pi pi-plus'" :label="editingMoneyBalanceId ? 'Сохранить деньги' : 'Добавить деньги'" type="submit" />
        </div>
      </form>
    </Dialog>
  </main>
</template>
