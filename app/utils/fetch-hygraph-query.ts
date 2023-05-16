export const fetchHygraphQuery = async (query: string, revalidate?: number) => {
  const response = await fetch(process.env.HYGRAPH_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.HYGRAPH_TOKEN}`
    },
    body: JSON.stringify({ query }),
    next: {
      revalidate // ... Horas de Cache da Query
    }
  })

  const { data } = await response.json()
  return data
}
