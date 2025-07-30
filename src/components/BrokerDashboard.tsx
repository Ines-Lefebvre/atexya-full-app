import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBrokerPoints } from '../hooks/useBrokerPointsNew'
import { useContrats } from '../hooks/useContrats'
import { useNotifications } from '../hooks/useNotifications'
import AtexyaService from '../services/atexya-service'
import type { BrokerDashboard as BrokerDashboardType } from '../lib/supabaseClient'
import { formatCurrency, formatPoints, formatDate } from '../lib/supabaseClient'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Gift, 
  Bell, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

const BrokerDashboard: React.FC = () => {
  const { user, isBroker } = useAuth()
  const { brokerPoints, config, updateConfig, loading: pointsLoading } = useBrokerPoints(user?.id)
  const { contrats, loading: contratsLoading } = useContrats(user?.id)
  const { notifications, unreadCount, markAsRead } = useNotifications(user?.id, user?.role)
  const [dashboard, setDashboard] = useState<BrokerDashboardType | null>(null)
  const [loading, setLoading] = useState(true)

  // Mémorisation des calculs coûteux sur les contrats
  const contractStats = useMemo(() => {
    if (!contrats || contrats.length === 0) {
      return {
        contratsActifs: 0,
        contratsCeMois: 0,
        commissionTotale: 0,
        commissionCeMois: 0
      }
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const contratsActifs = contrats.filter(c => c.statut === 'en_cours').length
    const contratsCeMois = contrats.filter(c => new Date(c.created_at) >= startOfMonth).length
    const commissionTotale = contrats.reduce((sum, c) => sum + (c.commission || 0), 0)
    const commissionCeMois = contrats
      .filter(c => new Date(c.created_at) >= startOfMonth)
      .reduce((sum, c) => sum + (c.commission || 0), 0)

    return {
      contratsActifs,
      contratsCeMois,
      commissionTotale,
      commissionCeMois
    }
  }, [contrats])

  // Mémorisation des calculs sur les points distribués
  const pointsStats = useMemo(() => {
    if (!dashboard) {
      return {
        pointsDistribuesTotal: 0,
        pointsDistribuesCeMois: 0
      }
    }

    return {
      pointsDistribuesTotal: dashboard.points_distribues_total || 0,
      pointsDistribuesCeMois: dashboard.points_distribues_ce_mois || 0
    }
  }, [dashboard])

  // Mémorisation du filtrage des notifications
  const filteredNotifications = useMemo(() => {
    return notifications.slice(0, 5)
  }, [notifications])

  // Mémorisation du filtrage des contrats récents
  const recentContrats = useMemo(() => {
    return contrats.slice(0, 5)
  }, [contrats])

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id || !isBroker) return

      setLoading(true)
      try {
        const { data, error } = await AtexyaService.getBrokerDashboard(user.id)
        if (error) {
          console.error('Erreur dashboard:', error)
        } else {
          setDashboard(data)
        }
      } catch (error) {
        console.error('Erreur dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [user?.id, isBroker])

  const handleConfigUpdate = async (updates: any) => {
    const { error } = await updateConfig(updates)
    if (!error) {
      // Recharger le dashboard
      const { data } = await AtexyaService.getBrokerDashboard(user!.id)
      if (data) setDashboard(data)
    }
  }

  if (!isBroker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h1>
          <p className="text-gray-600">Cette page est réservée aux courtiers.</p>
        </div>
      </div>
    )
  }

  if (loading || pointsLoading || contratsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Courtier</h1>
              <p className="text-gray-600">Bienvenue, {user?.courtier_name || user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <Settings className="h-6 w-6 text-gray-600 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gift className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Points Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPoints(dashboard?.available_points || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Contrats Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contractStats.contratsActifs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Commission Ce Mois</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(contractStats.commissionCeMois)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nouveaux Contrats</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contractStats.contratsCeMois}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Points */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Configuration Points</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="points_nouveau_contrat" className="block text-sm font-medium text-gray-700 mb-2">
                    Points par nouveau contrat
                  </label>
                  <input
                    type="number"
                    id="points_nouveau_contrat"
                    min="0"
                    max="1000"
                    value={config?.points_nouveau_contrat || 200}
                    onChange={(e) => handleConfigUpdate({
                      points_nouveau_contrat: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="points_renouvellement" className="block text-sm font-medium text-gray-700 mb-2">
                    Points par renouvellement
                  </label>
                  <input
                    type="number"
                    id="points_renouvellement"
                    min="0"
                    max="500"
                    value={config?.points_renouvellement || 0}
                    onChange={(e) => handleConfigUpdate({
                      points_renouvellement: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto_attribution"
                    checked={config?.auto_attribution !== false}
                    onChange={(e) => handleConfigUpdate({
                      auto_attribution: e.target.checked
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto_attribution" className="ml-2 text-sm text-gray-700">
                    Attribution automatique
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Solde total: {formatPoints(dashboard?.total_points || 0)}<br />
                    Points utilisés: {formatPoints(dashboard?.used_points || 0)}<br />
                    Points distribués ce mois: {formatPoints(pointsStats.pointsDistribuesCeMois)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contrats récents */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contrats Récents</h3>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entreprise
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Garantie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentContrats.map((contrat) => (
                      <tr key={contrat.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contrat.entreprise_raison_sociale}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contrat.entreprise_siren}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(contrat.garantie)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            contrat.statut === 'en_cours' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {contrat.statut === 'en_cours' ? 'Actif' : contrat.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(contrat.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {filteredNotifications.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-6 ${notification.statut === 'non_lu' ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {notification.type_notification === 'solde_insuffisant' ? (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        ) : notification.statut === 'traite' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                        {notification.statut === 'non_lu' && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrokerDashboard
