import { neon } from '@neondatabase/serverless'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AppState } from '../../types/domain'

const dataDir = join(process.cwd(), '.data')
const dataFile = join(dataDir, 'app-state.json')
const stateRowId = 'main'

let sqlClient: ReturnType<typeof neon> | null = null

const getDatabaseUrl = () =>
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || ''

const getSqlClient = () => {
  if (!sqlClient) {
    const databaseUrl = getDatabaseUrl()

    if (!databaseUrl) {
      return null
    }

    sqlClient = neon(databaseUrl)
  }

  return sqlClient
}

const today = new Date()
const isoDate = (date: Date) => date.toISOString().slice(0, 10)
const shiftDays = (days: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

const defaultState = (): AppState => ({
  clients: [
    {
      id: 'client-regular-1',
      name: 'Acme Digital',
      type: 'regular',
      contact: 'ivan@acme.example',
      defaultCurrency: 'EUR',
      paymentTerms: '50% предоплата, 50% после сдачи',
      notes: 'Постоянный клиент, обычно платит в течение недели.'
    },
    {
      id: 'client-one-1',
      name: 'Разовый заказчик',
      type: 'one_time',
      contact: '@client_tg',
      defaultCurrency: 'EUR',
      paymentTerms: '100% после приемки',
      notes: ''
    }
  ],
  deals: [
    {
      id: 'deal-crm',
      clientId: 'client-regular-1',
      title: 'CRM для отдела продаж',
      amount: 4200,
      currency: 'EUR',
      status: 'in_progress',
      startDate: shiftDays(-18),
      dueDate: shiftDays(12),
      expectedPaymentDate: shiftDays(18),
      probability: 100,
      notes: [
        {
          id: 'note-1',
          createdAt: new Date().toISOString(),
          text: 'Согласовать финальный список отчетов перед вторым этапом.'
        }
      ]
    },
    {
      id: 'deal-landing',
      clientId: 'client-one-1',
      title: 'Лендинг и интеграция формы',
      amount: 950,
      currency: 'EUR',
      status: 'awaiting_payment',
      startDate: shiftDays(-10),
      dueDate: shiftDays(-2),
      expectedPaymentDate: shiftDays(3),
      probability: 100,
      notes: []
    }
  ],
  payments: [
    {
      id: 'payment-crm-1',
      dealId: 'deal-crm',
      amount: 2100,
      dueDate: shiftDays(-15),
      paidDate: shiftDays(-14),
      status: 'received',
      type: 'prepayment',
      method: 'Bank transfer',
      invoice: 'INV-2026-001'
    },
    {
      id: 'payment-crm-2',
      dealId: 'deal-crm',
      amount: 2100,
      dueDate: shiftDays(18),
      paidDate: '',
      status: 'expected',
      type: 'final',
      method: 'Bank transfer',
      invoice: 'INV-2026-002'
    },
    {
      id: 'payment-landing-1',
      dealId: 'deal-landing',
      amount: 950,
      dueDate: shiftDays(-2),
      paidDate: '',
      status: 'expected',
      type: 'final',
      method: 'Wise',
      invoice: ''
    }
  ],
  expenses: [
    {
      id: 'expense-hosting',
      dealId: '',
      title: 'Серверы и мониторинг',
      amount: 80,
      category: 'hosting',
      date: shiftDays(-5),
      recurring: 'monthly'
    },
    {
      id: 'expense-contractor',
      dealId: 'deal-crm',
      title: 'Верстка внутренних экранов',
      amount: 350,
      category: 'contractors',
      date: shiftDays(-3),
      recurring: 'none'
    }
  ],
  expensePlannerCategories: [],
  plannedExpenses: [],
  expensePlannerPayments: [],
  incomePlannerCategories: [],
  plannedIncomes: [],
  incomePlannerPayments: [],
  moneyBalances: [],
  creditCards: []
})

const normalizeExpensePlannerPayments = (
  payments: Partial<AppState>['expensePlannerPayments']
): AppState['expensePlannerPayments'] =>
  Array.isArray(payments)
    ? payments.map((payment) => ({
        ...payment,
        creditCardId: typeof payment.creditCardId === 'string' ? payment.creditCardId : '',
        notes: typeof payment.notes === 'string' ? payment.notes : ''
      }))
    : []

const normalizeIncomePlannerPayments = (
  payments: Partial<AppState>['incomePlannerPayments']
): AppState['incomePlannerPayments'] =>
  Array.isArray(payments)
    ? payments.map((payment) => ({
        ...payment,
        notes: typeof payment.notes === 'string' ? payment.notes : ''
      }))
    : []

const normalizeState = (state: Partial<AppState>): AppState => ({
  clients: Array.isArray(state.clients) ? state.clients : [],
  deals: Array.isArray(state.deals) ? state.deals : [],
  payments: Array.isArray(state.payments) ? state.payments : [],
  expenses: Array.isArray(state.expenses) ? state.expenses : [],
  expensePlannerCategories: Array.isArray(state.expensePlannerCategories)
    ? state.expensePlannerCategories
    : [],
  plannedExpenses: Array.isArray(state.plannedExpenses) ? state.plannedExpenses : [],
  expensePlannerPayments: normalizeExpensePlannerPayments(state.expensePlannerPayments),
  incomePlannerCategories: Array.isArray(state.incomePlannerCategories)
    ? state.incomePlannerCategories
    : [],
  plannedIncomes: Array.isArray(state.plannedIncomes) ? state.plannedIncomes : [],
  incomePlannerPayments: normalizeIncomePlannerPayments(state.incomePlannerPayments),
  moneyBalances: Array.isArray(state.moneyBalances) ? state.moneyBalances : [],
  creditCards: Array.isArray(state.creditCards) ? state.creditCards : []
})

const ensureStateTable = async () => {
  const sql = getSqlClient()
  if (!sql) return null

  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `

  return sql
}

const readFileState = async (): Promise<AppState> => {
  await mkdir(dataDir, { recursive: true })

  try {
    const raw = await readFile(dataFile, 'utf8')
    return normalizeState(JSON.parse(raw) as Partial<AppState>)
  } catch {
    const state = defaultState()
    await writeState(state)
    return state
  }
}

const writeFileState = async (state: AppState): Promise<AppState> => {
  await mkdir(dataDir, { recursive: true })
  await writeFile(dataFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  return state
}

export const readState = async (): Promise<AppState> => {
  const sql = await ensureStateTable()

  if (!sql) {
    return readFileState()
  }

  const rows = (await sql`
    SELECT data
    FROM app_state
    WHERE id = ${stateRowId}
    LIMIT 1
  `) as Array<{ data: Partial<AppState> }>

  if (rows[0]?.data) {
    return normalizeState(rows[0].data)
  }

  const state = defaultState()
  await writeState(state)
  return state
}

export const writeState = async (state: AppState): Promise<AppState> => {
  const normalizedState = normalizeState(state)
  const sql = await ensureStateTable()

  if (!sql) {
    return writeFileState(normalizedState)
  }

  await sql`
    INSERT INTO app_state (id, data, updated_at)
    VALUES (${stateRowId}, ${JSON.stringify(normalizedState)}::jsonb, now())
    ON CONFLICT (id)
    DO UPDATE SET
      data = excluded.data,
      updated_at = now()
  `

  return normalizedState
}
