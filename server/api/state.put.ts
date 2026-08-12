import { readBody, createError } from 'h3'
import { writeState } from '../utils/store'
import type { AppState } from '../../types/domain'

const isState = (value: unknown): value is AppState => {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  return (
    Array.isArray(state.clients) &&
    Array.isArray(state.deals) &&
    Array.isArray(state.payments) &&
    Array.isArray(state.expenses) &&
    Array.isArray(state.expensePlannerCategories) &&
    Array.isArray(state.plannedExpenses) &&
    Array.isArray(state.expensePlannerPayments) &&
    Array.isArray(state.incomePlannerCategories) &&
    Array.isArray(state.plannedIncomes) &&
    Array.isArray(state.incomePlannerPayments) &&
    Array.isArray(state.moneyBalances)
  )
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!isState(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid app state'
    })
  }

  return writeState(body)
})
