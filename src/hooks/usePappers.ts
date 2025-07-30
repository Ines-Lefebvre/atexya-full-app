import { useEffect, useState } from 'react'

interface PappersData {
  siren: string
  nom_entreprise: string
  code_naf: string
  libelle_code_naf: string
}

export function usePappers(siren: string | null) {
  const [data, setData] = useState<PappersData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  useEffect(() => {
    if (!siren) return
    setLoading(true)
    setError(null)

    fetch(`https://api.pappers.fr/v2/entreprise?siren=${siren}`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PAPPERS_API_KEY}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erreur API Pappers')
        return res.json()
      })
      .then((json) => {
        setData({
          siren: json.entreprise.siren,
          nom_entreprise: json.entreprise.nom_entreprise,
          code_naf: json.entreprise.code_naf,
          libelle_code_naf: json.entreprise.libelle_code_naf
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [siren])

  return { data, loading, error }
}