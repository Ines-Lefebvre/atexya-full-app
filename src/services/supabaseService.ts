import { supabase, Simulation, User, SimulationInsert, UserInsert } from '../lib/supabaseClient'

// Service pour les simulations
export class SimulationService {
  // Créer une simulation avec données Pappers
  static async createSimulationWithPappers(
    simulationData: {
      simulation_number: string
      entreprise_id?: string | null
      user_id?: string | null
      broker_id?: string | null
      employees_count: number
      ctn_code: string
      guarantee_amount: number
      ipp_type: string
      had_ip_gt_10_last_4y: boolean
      prime_ht: number
      prime_ttc: number
      commission_rate: number
      commission_amount: number
      email?: string
      courtier?: string | null
      statut: string
    },
    pappersData: any
  ) {
    try {
      const dbData = {
        simulation_number: simulationData.simulation_number,
        entreprise_id: simulationData.entreprise_id,
        user_id: simulationData.user_id,
        broker_id: simulationData.broker_id,
        employees_count: simulationData.employees_count,
        ctn_code: simulationData.ctn_code,
        guarantee_amount: simulationData.guarantee_amount,
        ipp_type: simulationData.ipp_type,
        had_ip_gt_10_last_4y: simulationData.had_ip_gt_10_last_4y,
        prime_ht: simulationData.prime_ht,
        prime_ttc: simulationData.prime_ttc,
        commission_rate: simulationData.commission_rate,
        commission_amount: simulationData.commission_amount,
        statut: simulationData.statut,
        email: simulationData.email,
        courtier: simulationData.courtier,
        pappers_data: pappersData,
        company_name: pappersData?.denomination || pappersData?.company_data?.raison_sociale,
        siren: pappersData?.siren || pappersData?.company_data?.siren,
        siret: pappersData?.siege?.siret || pappersData?.company_data?.siret
      };

      console.log('🔄 Données simulation préparées:', dbData);

      const { data, error } = await supabase
        .from('simulations')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création simulation:', error);
      } else {
        console.log('✅ Simulation créée:', data?.id);
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Exception simulation:', error);
      return { data: null, error };
    }
  }

  // Mettre à jour le statut d'une simulation
  static async updateSimulationStatus(
    simulationId: string,
    status: 'en_cours' | 'calculee' | 'soumise' | 'convertie' | 'abandonnee',
    additionalData?: Partial<Simulation>
  ) {
    try {
      const updateData: any = {
        statut: status,
        ...additionalData
      }

      // Ajouter les timestamps selon le statut
      if (status === 'soumise') {
        updateData.submitted_at = new Date().toISOString()
      } else if (status === 'convertie') {
        updateData.converted_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('simulations')
        .update(updateData)
        .eq('id', simulationId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      return { data: null, error }
    }
  }

  // Récupérer les simulations avec informations utilisateur
  static async getSimulationsWithUser(filters?: {
    status?: string
    ctn_code?: string
    broker_id?: string
    user_id?: string
    date_from?: string
    date_to?: string
  }) {
    try {
      let query = supabase.from('simulations_with_user').select('*')

      if (filters) {
        if (filters.status) query = query.eq('statut', filters.status)
        if (filters.ctn_code) query = query.eq('ctn_code', filters.ctn_code)
        if (filters.broker_id) query = query.eq('broker_id', filters.broker_id)
        if (filters.user_id) query = query.eq('user_id', filters.user_id)
        if (filters.date_from) query = query.gte('created_at', filters.date_from)
        if (filters.date_to) query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Erreur lors de la récupération des simulations:', error)
      return { data: [], error }
    }
  }

  // Calculer les statistiques d'une simulation
  static async calculateSimulationStats(simulationId: string) {
    try {
      const { data: simulation, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .single()

      if (error || !simulation) {
        return { data: null, error: error || new Error('Simulation non trouvée') }
      }

      // Calculer les statistiques
      const stats = {
        completion_time: simulation.submitted_at 
          ? new Date(simulation.submitted_at).getTime() - new Date(simulation.created_at).getTime()
          : null,
        has_adjustments: simulation.guarantee_adjusted !== simulation.guarantee_amount ||
                        simulation.ipp_type_adjusted !== simulation.ipp_type,
        completeness_score: this.calculateCompletenessScore(simulation),
        risk_level: this.calculateRiskLevel(simulation)
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
      return { data: null, error }
    }
  }

  // Calculer le score de complétude
  private static calculateCompletenessScore(simulation: Simulation): number {
    let score = 0
    const maxScore = 10

    if (simulation.company_name) score += 1
    if (simulation.siren && simulation.siren.length === 9) score += 2
    if (simulation.contact_email) score += 1
    if (simulation.contact_phone) score += 1
    if (simulation.pappers_data) score += 2
    if (simulation.broker_id) score += 1
    if (simulation.prime_ttc) score += 2

    return (score / maxScore) * 100
  }

  // Calculer le niveau de risque
  private static calculateRiskLevel(simulation: Simulation): 'low' | 'medium' | 'high' {
    let riskScore = 0

    // Facteurs de risque
    if (simulation.had_ip_gt_10_last_4y) riskScore += 3
    if (simulation.previous_claims_count > 0) riskScore += simulation.previous_claims_count
    if (simulation.employees_count > 100) riskScore += 2
    if (['B', 'E'].includes(simulation.ctn_code)) riskScore += 2 // Secteurs à risque

    if (riskScore <= 2) return 'low'
    if (riskScore <= 5) return 'medium'
    return 'high'
  }
}

// Service pour les utilisateurs
export class UserService {
  // Créer un utilisateur complet avec profil
  static async createUserWithProfile(
    email: string,
    password: string,
    profileData: Omit<UserInsert, 'auth_user_id' | 'email'>
  ) {
    try {
      // Créer l'utilisateur dans Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError || !authData.user) {
        return { data: null, error: authError }
      }

      // Créer le profil
      const { data: profileData_, error: profileError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email,
          ...profileData
        })
        .select()
        .single()

      if (profileError) {
        // Supprimer l'utilisateur Auth en cas d'erreur
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { data: null, error: profileError }
      }

      return { data: { auth: authData, profile: profileData_ }, error: null }
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error)
      return { data: null, error }
    }
  }

  // Mettre à jour le dernier login
  static async updateLastLogin(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)

      return { error }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dernier login:', error)
      return { error }
    }
  }

  // Rechercher des utilisateurs avec filtres avancés
  static async searchUsers(filters: {
    search?: string
    role?: string
    is_active?: boolean
    created_after?: string
    created_before?: string
  }) {
    try {
      let query = supabase.from('users').select('*')

      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`)
      }

      if (filters.role) query = query.eq('role', filters.role)
      if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active)
      if (filters.created_after) query = query.gte('created_at', filters.created_after)
      if (filters.created_before) query = query.lte('created_at', filters.created_before)

      const { data, error } = await query.order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error)
      return { data: [], error }
    }
  }

  // Obtenir les statistiques d'un courtier
  static async getBrokerStatistics(brokerId: string) {
    try {
      const { data, error } = await supabase
        .from('broker_statistics')
        .select('*')
        .eq('broker_id', brokerId)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du courtier:', error)
      return { data: null, error }
    }
  }
}

// Service pour les points de fidélité
export class PointsService {
  // Attribuer des points pour une conversion
  static async awardConversionPoints(brokerId: string, simulationId: string, amount: number = 100) {
    try {
      const { data, error } = await supabase.rpc('update_broker_points', {
        p_broker_id: brokerId,
        p_operation_type: 'credit',
        p_points_amount: amount,
        p_description: `Points de conversion pour simulation ${simulationId}`,
        p_simulation_id: simulationId
      })

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de l\'attribution des points de conversion:', error)
      return { data: null, error }
    }
  }

  // Utiliser des points pour un avantage
  static async redeemPoints(brokerId: string, amount: number, description: string) {
    try {
      const { data, error } = await supabase.rpc('update_broker_points', {
        p_broker_id: brokerId,
        p_operation_type: 'debit',
        p_points_amount: amount,
        p_description: description
      })

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de l\'utilisation des points:', error)
      return { data: null, error }
    }
  }

  // Obtenir l'historique des points
  static async getPointsHistory(brokerId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('broker_points_log')
        .select('*')
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data: data || [], error }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des points:', error)
      return { data: [], error }
    }
  }

  // Synchroniser les points avec un système externe
  static async syncPointsFromExternal(brokerId: string, externalData: {
    total_points: number
    sync_id: string
    external_reference: string
  }) {
    try {
      // Récupérer les points actuels
      const { data: currentPoints, error: fetchError } = await supabase
        .from('broker_points')
        .select('total_points')
        .eq('broker_id', brokerId)
        .single()

      if (fetchError) {
        return { data: null, error: fetchError }
      }

      const difference = externalData.total_points - (currentPoints?.total_points || 0)

      if (difference !== 0) {
        // Mettre à jour les points
        const { data, error } = await supabase.rpc('update_broker_points', {
          p_broker_id: brokerId,
          p_operation_type: difference > 0 ? 'credit' : 'debit',
          p_points_amount: Math.abs(difference),
          p_description: `Synchronisation avec système externe (${externalData.external_reference})`
        })

        // Mettre à jour la date de synchronisation
        await supabase
          .from('broker_points')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('broker_id', brokerId)

        return { data, error }
      }

      return { data: true, error: null }
    } catch (error) {
      console.error('Erreur lors de la synchronisation des points:', error)
      return { data: null, error }
    }
  }
}

// Service pour les rapports et analytics
export class AnalyticsService {
  // Générer un rapport d'activité
  static async generateActivityReport(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase.rpc('admin_generate_activity_report', {
        p_start_date: startDate,
        p_end_date: endDate
      })

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      return { data: null, error }
    }
  }

  // Obtenir les tendances par CTN
  static async getCTNTrends() {
    try {
      const { data, error } = await supabase
        .from('business_ctn_analysis')
        .select('*')
        .order('total_simulations', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances CTN:', error)
      return { data: [], error }
    }
  }

  // Obtenir les performances mensuelles
  static async getMonthlyPerformance(months: number = 12) {
    try {
      const { data, error } = await supabase
        .from('business_monthly_performance')
        .select('*')
        .order('month', { ascending: false })
        .limit(months)

      return { data: data || [], error }
    } catch (error) {
      console.error('Erreur lors de la récupération des performances mensuelles:', error)
      return { data: [], error }
    }
  }

  // Calculer les KPI en temps réel
  static async calculateKPIs(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    try {
      const now = new Date()
      let startDate: Date

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      const { data, error } = await supabase
        .from('simulations')
        .select('statut, prime_ttc, created_at, broker_id')
        .gte('created_at', startDate.toISOString())

      if (error) {
        return { data: null, error }
      }

      const kpis = {
        total_simulations: data.length,
        conversions: data.filter(s => s.statut === 'convertie').length,
        conversion_rate: data.length > 0 ? (data.filter(s => s.statut === 'convertie').length / data.length) * 100 : 0,
        total_revenue: data.filter(s => s.statut === 'convertie').reduce((sum, s) => sum + (s.prime_ttc || 0), 0),
        active_brokers: new Set(data.map(s => s.broker_id).filter(Boolean)).size,
        avg_simulation_value: data.length > 0 ? data.reduce((sum, s) => sum + (s.prime_ttc || 0), 0) / data.length : 0
      }

      return { data: kpis, error: null }
    } catch (error) {
      console.error('Erreur lors du calcul des KPI:', error)
      return { data: null, error }
    }
  }
}



// Service pour les entreprises
export class EntrepriseService {
  // Créer ou mettre à jour une entreprise
  static async createOrUpdateEntreprise(entrepriseData: {
    siren: string
    siret?: string | null
    raison_sociale: string
    adresse_ligne_1?: string | null
    code_postal?: string | null
    ville?: string | null
    code_ape?: string | null
    activite_principale?: string | null
    forme_juridique?: string | null
    effectif_pappers?: number | null
    ctn_code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'
    pappers_data?: any
  }) {
    try {
      // ✅ CORRECTION : Utiliser .maybeSingle() au lieu de .single()
      const { data: existing, error: checkError } = await supabase
        .from('entreprises')
        .select('id')
        .eq('siren', entrepriseData.siren)
        .maybeSingle() // ✅ Ne lève pas d'erreur si aucun résultat
      
      // Vérifier les erreurs de la requête de vérification
      if (checkError) {
        console.error('❌ Erreur lors de la vérification de l\'entreprise:', checkError)
        return { data: null, error: checkError }
      }
      
      if (existing) {
        // Mettre à jour l'entreprise existante
        console.log('🔄 Mise à jour de l\'entreprise existante:', existing.id)
        const { data, error } = await supabase
          .from('entreprises')
          .update({
            siret: entrepriseData.siret,
            raison_sociale: entrepriseData.raison_sociale,
            adresse: entrepriseData.adresse_ligne_1 || null,
            ctn: entrepriseData.ctn_code,
            effectif: entrepriseData.effectif_pappers,
            adresse_ligne_1: entrepriseData.adresse_ligne_1,
            code_postal: entrepriseData.code_postal,
            ville: entrepriseData.ville,
            code_ape: entrepriseData.code_ape,
            activite_principale: entrepriseData.activite_principale,
            forme_juridique: entrepriseData.forme_juridique,
            effectif_pappers: entrepriseData.effectif_pappers,
            pappers_data: entrepriseData.pappers_data,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()
        
        if (error) {
          console.error('❌ Erreur lors de la mise à jour:', error)
        } else {
          console.log('✅ Entreprise mise à jour avec succès:', data?.id)
        }
        
        return { data, error }
      } else {
        // Créer une nouvelle entreprise
        console.log('➕ Création d\'une nouvelle entreprise')
        const { data, error } = await supabase
          .from('entreprises')
          .insert({
            siren: entrepriseData.siren,
            siret: entrepriseData.siret,
            raison_sociale: entrepriseData.raison_sociale,
            adresse: entrepriseData.adresse_ligne_1 || null,
            ctn: entrepriseData.ctn_code,
            effectif: entrepriseData.effectif_pappers,
            adresse_ligne_1: entrepriseData.adresse_ligne_1,
            code_postal: entrepriseData.code_postal,
            ville: entrepriseData.ville,
            code_ape: entrepriseData.code_ape,
            activite_principale: entrepriseData.activite_principale,
            forme_juridique: entrepriseData.forme_juridique,
            effectif_pappers: entrepriseData.effectif_pappers,
            pappers_data: entrepriseData.pappers_data
          })
          .select()
          .single()
        
        if (error) {
          console.error('❌ Erreur lors de la création:', error)
        } else {
          console.log('✅ Nouvelle entreprise créée avec succès:', data?.id)
        }
        
        return { data, error }
      }
    } catch (error) {
      console.error('❌ Exception dans createOrUpdateEntreprise:', error)
      return { data: null, error }
    }
  }

  // Récupérer une entreprise par SIREN
  static async getEntrepriseBySiren(siren: string) {
    try {
      const { data, error } = await supabase
        .from('entreprises')
        .select('*')
        .eq('siren', siren)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'entreprise:', error)
      return { data: null, error }
    }
  }

  // Récupérer les simulations d'une entreprise
  static async getEntrepriseSimulations(entrepriseId: string) {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Erreur lors de la récupération des simulations de l\'entreprise:', error)
      return { data: [], error }
    }
  }
}

