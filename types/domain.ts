export type ClientType = 'regular' | 'one_time'
export type DealStatus =
  | 'draft'
  | 'proposal'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_payment'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'paused'
  | 'cancelled'
export type PaymentStatus = 'planned' | 'expected' | 'received' | 'overdue' | 'cancelled'
export type PaymentType = 'prepayment' | 'milestone' | 'final' | 'refund'
export type ExpenseCategory =
  | 'services'
  | 'hosting'
  | 'software'
  | 'contractors'
  | 'marketing'
  | 'taxes'
  | 'equipment'
  | 'other'
export type RecurringMode = 'none' | 'monthly' | 'yearly'

export interface Client {
  id: string
  name: string
  type: ClientType
  contact: string
  defaultCurrency: string
  paymentTerms: string
  notes: string
}

export interface DealNote {
  id: string
  createdAt: string
  text: string
}

export interface Deal {
  id: string
  clientId: string
  title: string
  amount: number
  currency: string
  status: DealStatus
  startDate: string
  dueDate: string
  expectedPaymentDate: string
  probability: number
  notes: DealNote[]
}

export interface Payment {
  id: string
  dealId: string
  amount: number
  dueDate: string
  paidDate: string
  status: PaymentStatus
  type: PaymentType
  method: string
  invoice: string
}

export interface Expense {
  id: string
  dealId: string
  title: string
  amount: number
  category: ExpenseCategory
  date: string
  recurring: RecurringMode
}

export interface ExpensePlannerCategory {
  id: string
  name: string
  systemType?: 'credit_principal' | 'credit_interest'
  deletedAt?: string
}

export interface PlannedExpense {
  id: string
  title: string
  categoryId: string
  creditCardId?: string
  amount: number
  currency: string
  plannedDate: string
  notes: string
}

export interface ExpensePlannerPayment {
  id: string
  plannedExpenseId: string
  creditCardId?: string
  amount: number
  currency: string
  paidDate: string
  notes: string
}

export interface IncomePlannerCategory {
  id: string
  name: string
  deletedAt?: string
}

export interface PlannedIncome {
  id: string
  title: string
  categoryId: string
  amount: number
  currency: string
  plannedDate: string
  notes: string
}

export interface IncomePlannerPayment {
  id: string
  plannedIncomeId: string
  amount: number
  currency: string
  paidDate: string
  notes: string
}

export interface MoneyBalance {
  id: string
  title: string
  amount: number
  currency: string
  date: string
  notes: string
}

export interface CreditCard {
  id: string
  title: string
  creditLimit: number
  debt: number
  currency: string
  notes: string
}

export interface AppState {
  clients: Client[]
  deals: Deal[]
  payments: Payment[]
  expenses: Expense[]
  expensePlannerCategories: ExpensePlannerCategory[]
  plannedExpenses: PlannedExpense[]
  expensePlannerPayments: ExpensePlannerPayment[]
  incomePlannerCategories: IncomePlannerCategory[]
  plannedIncomes: PlannedIncome[]
  incomePlannerPayments: IncomePlannerPayment[]
  moneyBalances: MoneyBalance[]
  creditCards: CreditCard[]
}
