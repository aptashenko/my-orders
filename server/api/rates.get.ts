interface NbuRate {
  r030: number
  txt: string
  rate: number
  cc: string
  exchangedate: string
}

const fetchNbuRate = async (currency: 'EUR' | 'USD') => {
  const response = await fetch(
    `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currency}&json`
  )

  if (!response.ok) {
    throw new Error(`NBU rate request failed for ${currency}`)
  }

  const data = (await response.json()) as NbuRate[]
  const rate = data[0]

  if (!rate?.rate) {
    throw new Error(`NBU rate response is empty for ${currency}`)
  }

  return rate
}

export default defineEventHandler(async () => {
  const [eur, usd] = await Promise.all([fetchNbuRate('EUR'), fetchNbuRate('USD')])

  return {
    base: 'UAH',
    source: 'НБУ',
    exchangedate: eur.exchangedate,
    rates: {
      UAH: 1,
      EUR: eur.rate,
      USD: usd.rate,
      USDT: usd.rate
    }
  }
})
