import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://lgwzlojrtsagbbobifea.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd3psb2pydHNhZ2Jib2JpZmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTQ1MjMsImV4cCI6MjA2ODQzMDUyM30.MvBthaay_qFIgDoX-hqW0k6ROYwrL74MsIa5qMRZPAg'

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// =====================================================
// TYPES TYPESCRIPT BASÉS SUR LA STRUCTURE RÉELLE
// =====================================================

// Types ENUM
export type UserRole = 'client' | 'courtier' | 'admin'
export type CTNCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'
export type IPPType = 'IP3 & IP4' | 'IP4_seul'
export type SimulationStatus = 'en_cours' | 'calculee' | 'soumise' | 'convertie' | 'abandonnee'
export type ContratStatus = 'en_cours' | 'expire' | 'resilie' | 'transfere'
export type PaiementStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type TransfertStatus = 'valide' | 'echec' | 'attente_intervention' | 'force_admin'
export type TransfertType = 'nouveau_contrat' | 'renouvellement' | 'bonus' | 'correction'
export type PointOperation = 'credit' | 'debit'
export type ActionInsuffisant = 'notify_only' | 'block' | 'defer'
export type NotificationType = 'solde_insuffisant' | 'intervention_requise' | 'transfert_complete'
export type NotificationStatus = 'non_lu' | 'lu' | 'traite'

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

// Interface User (existante)
export interface User {
  id: string
  auth_user_id?: string
  email: string
  role: UserRole
  courtier_code?: string
  courtier_name?: string
  created_at: string
}

// Interface Entreprise (nouvelle)
export interface Entreprise {
  id: string
  siren: string
  siret: string
  raison_sociale: string
  adresse: string
  ctn?: string
  effectif?: number
  created_at: string
  updated_at: string
}

// Interface Simulation (existante, adaptée)
export interface Simulation {
  id: string
  simulation_number: string
  user_id?: string
  broker_id?: string
  employees_count: number
  ctn_code: CTNCode
  guarantee_amount: number
  ipp_type: IPPType
  had_ip_gt_10_last_4y?: boolean
  prime_ht?: number
  prime_ttc?: number
  commission_rate?: number
  commission_amount?: number
  statut: SimulationStatus
  created_at: string
}

// Interface Contrat (nouvelle)
export interface Contrat {
  id: string
  reference: string
  simulation_id?: string
  entreprise_id: string
  broker_id: string
  date_debut: string
  date_fin: string
  garantie: number
  prime: number
  commission: number
  statut: ContratStatus
  created_at: string
  updated_at: string
}

// Interface Paiement (nouvelle)
export interface Paiement {
  id: string
  reference: string
  contrat_id: string
  stripe_payment_id?: string
  montant_ht: number
  montant_ttc: number
  mode_paiement?: string
  commission_broker: number
  statut: PaiementStatus
  created_at: string
  updated_at: string
}

// Interface BrokerPoints (existante)
export interface BrokerPoints {
  id: string
  broker_id: string
  total_points: number
  used_points: number
  available_points: number
  created_at: string
}

// Interface BrokerPointsConfig (nouvelle)
export interface BrokerPointsConfig {
  id: string
  broker_id: string
  points_nouveau_contrat: number
  points_renouvellement: number
  auto_attribution: boolean
  action_si_insuffisant: ActionInsuffisant
  created_at: string
  updated_at: string
}

// Interface EntreprisePoints (nouvelle)
export interface EntreprisePoints {
  id: string
  entreprise_id: string
  points_recus: number
  points_utilises: number
  available_points: number
  praemia_customer_id?: string
  last_sync_at?: string
  created_at: string
  updated_at: string
}

// Interface TransfertPoints (nouvelle)
export interface TransfertPoints {
  id: string
  contrat_id: string
  paiement_id: string
  broker_id: string
  entreprise_id: string
  type_transfert: TransfertType
  points_configures: number
  points_appliques: number
  statut: TransfertStatus
  created_at: string
  updated_at: string
}

// Interface BrokerPointsLog (existante)
export interface BrokerPointsLog {
  id: string
  broker_id: string
  simulation_id?: string
  operation_type: PointOperation
  points_amount: number
  balance_before: number
  balance_after: number
  description: string
  created_at: string
}

// Interface NotificationsPoints (nouvelle)
export interface NotificationsPoints {
  id: string
  type_notification: NotificationType
  broker_id?: string
  admin_id?: string
  message: string
  url_action?: string
  statut: NotificationStatus
  created_at: string
  updated_at: string
}

// =====================================================
// TYPES POUR LES OPÉRATIONS
// =====================================================

// Types pour les insertions
export interface EntrepriseInsert extends Omit<Entreprise, 'id' | 'created_at' | 'updated_at'> {}
export interface ContratInsert extends Omit<Contrat, 'id' | 'created_at' | 'updated_at'> {}
export interface PaiementInsert extends Omit<Paiement, 'id' | 'created_at' | 'updated_at'> {}
export interface BrokerPointsConfigInsert extends Omit<BrokerPointsConfig, 'id' | 'created_at' | 'updated_at'> {}
export interface TransfertPointsInsert extends Omit<TransfertPoints, 'id' | 'created_at' | 'updated_at'> {}
export interface NotificationsPointsInsert extends Omit<NotificationsPoints, 'id' | 'created_at' | 'updated_at'> {}

// Types pour les mises à jour
export interface EntrepriseUpdate extends Partial<Omit<Entreprise, 'id' | 'created_at'>> {}
export interface ContratUpdate extends Partial<Omit<Contrat, 'id' | 'created_at'>> {}
export interface PaiementUpdate extends Partial<Omit<Paiement, 'id' | 'created_at'>> {}
export interface BrokerPointsConfigUpdate extends Partial<Omit<BrokerPointsConfig, 'id' | 'created_at'>> {}
export interface TransfertPointsUpdate extends Partial<Omit<TransfertPoints, 'id' | 'created_at'>> {}

// =====================================================
// TYPES POUR LES VUES ET JOINTURES
// =====================================================

// Vue complète d'un contrat avec toutes les informations
export interface ContratComplet extends Contrat {
  // Informations entreprise
  entreprise_siren?: string
  entreprise_raison_sociale?: string
  entreprise_adresse?: string
  
  // Informations broker
  broker_email?: string
  broker_courtier_name?: string
  
  // Informations simulation
  simulation_number?: string
  
  // Informations paiement
  paiement_statut?: PaiementStatus
  paiement_stripe_id?: string
  
  // Informations transfert points
  transfert_points_appliques?: number
  transfert_statut?: TransfertStatus
}

// Vue dashboard broker
export interface BrokerDashboard {
  broker_id: string
  broker_email: string
  courtier_name?: string
  
  // Points
  total_points: number
  used_points: number
  available_points: number
  
  // Statistiques contrats
  total_contrats: number
  contrats_actifs: number
  contrats_ce_mois: number
  
  // Revenus
  commission_totale: number
  commission_ce_mois: number
  
  // Points distribués
  points_distribues_total: number
  points_distribues_ce_mois: number
  
  // Configuration
  points_par_contrat: number
  auto_attribution: boolean
}

// Vue dashboard entreprise
export interface EntrepriseDashboard extends Entreprise {
  // Points
  points_recus: number
  points_utilises: number
  available_points: number
  
  // Contrats
  contrat_actuel?: ContratComplet
  nombre_contrats: number
  
  // Broker actuel
  broker_actuel_name?: string
  broker_actuel_email?: string
}

// =====================================================
// TYPES POUR LES RÉPONSES API
// =====================================================

export interface SupabaseResponse<T> {
  data: T | null
  error: any
}

export interface SupabaseListResponse<T> {
  data: T[]
  error: any
  count?: number
}

// =====================================================
// TYPES POUR LES HOOKS
// =====================================================

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<SupabaseResponse<any>>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<SupabaseResponse<any>>
  signOut: () => Promise<{ error: any }>
  updateProfile: (updates: Partial<User>) => Promise<SupabaseResponse<User>>
  isAuthenticated: boolean
  isClient: boolean
  isBroker: boolean
  isAdmin: boolean
}

export interface UseEntreprisesReturn {
  entreprises: Entreprise[]
  loading: boolean
  fetchEntreprises: () => Promise<void>
  createEntreprise: (data: EntrepriseInsert) => Promise<SupabaseResponse<Entreprise>>
  updateEntreprise: (id: string, updates: EntrepriseUpdate) => Promise<SupabaseResponse<Entreprise>>
  getEntrepriseBySiren: (siren: string) => Promise<SupabaseResponse<Entreprise>>
}

export interface UseContratsReturn {
  contrats: ContratComplet[]
  loading: boolean
  fetchContrats: () => Promise<void>
  createContrat: (data: ContratInsert) => Promise<SupabaseResponse<Contrat>>
  updateContrat: (id: string, updates: ContratUpdate) => Promise<SupabaseResponse<Contrat>>
  getContratsByBroker: (brokerId: string) => Promise<SupabaseResponse<ContratComplet[]>>
  getContratsByEntreprise: (entrepriseId: string) => Promise<SupabaseResponse<ContratComplet[]>>
}

export interface UseBrokerPointsReturn {
  brokerPoints: BrokerPoints | null
  config: BrokerPointsConfig | null
  loading: boolean
  fetchBrokerPoints: () => Promise<void>
  updateConfig: (updates: BrokerPointsConfigUpdate) => Promise<SupabaseResponse<BrokerPointsConfig>>
  availablePoints: number
  totalPoints: number
  usedPoints: number
}

export interface UseNotificationsReturn {
  notifications: NotificationsPoints[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<SupabaseResponse<NotificationsPoints>>
  markAsProcessed: (id: string) => Promise<SupabaseResponse<NotificationsPoints>>
}

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

export const isValidUserRole = (role: string): role is UserRole => {
  return ['client', 'courtier', 'admin'].includes(role)
}

export const isValidCTNCode = (code: string): code is CTNCode => {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].includes(code)
}

export const isValidSimulationStatus = (status: string): status is SimulationStatus => {
  return ['en_cours', 'calculee', 'soumise', 'convertie', 'abandonnee'].includes(status)
}

export const isValidContratStatus = (status: string): status is ContratStatus => {
  return ['en_cours', 'expire', 'resilie', 'transfere'].includes(status)
}

export const isValidPaiementStatus = (status: string): status is PaiementStatus => {
  return ['pending', 'completed', 'failed', 'refunded'].includes(status)
}

// Fonctions de formatage
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
}

export const formatPoints = (points: number): string => {
  return `${points.toLocaleString('fr-FR')} points`
}

// Constantes
export const DEFAULT_USER_ROLE: UserRole = 'client'
export const DEFAULT_SIMULATION_STATUS: SimulationStatus = 'en_cours'
export const DEFAULT_CONTRAT_STATUS: ContratStatus = 'en_cours'
export const DEFAULT_PAIEMENT_STATUS: PaiementStatus = 'pending'
export const DEFAULT_POINTS_NOUVEAU_CONTRAT = 200
export const DEFAULT_POINTS_RENOUVELLEMENT = 0

// Export du client par défaut
export default supabase

