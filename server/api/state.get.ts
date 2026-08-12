import { readState } from '../utils/store'

export default defineEventHandler(async () => {
  return readState()
})
