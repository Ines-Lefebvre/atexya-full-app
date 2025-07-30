// Types pour le questionnaire
export interface QuestionnaireData {
  employees_count: number;
  ctn_code: string;
  guarantee_amount: number;
  ipp_type: string;
  had_ip_gt_10_last_4y: boolean;
}

// Interface pour le résultat de calcul
export interface CalculationResult {
  isValid: boolean;
  errors: string[];
  prime_ht: number;
  prime_ttc: number;
  commission_rate: number;
  commission_amount: number;
  taux_base: number;
  coefficient_secteur: number;
  coefficient_garantie: number;
  coefficient_ipp: number;
  coefficient_historique: number;
  details?: {
    base_calculation: number;
    adjustments: {
      secteur: number;
      garantie: number;
      ipp: number;
      historique: number;
    };
  };
}

// Taux de base par CTN (en pourcentage du nombre d'employés)
const CTN_BASE_RATES: Record<string, number> = {
  'A': 0.45, // Métallurgie
  'B': 0.85, // BTP - Secteur à risque élevé
  'C': 0.35, // Transports
  'D': 0.25, // Services/commerces - Secteur à faible risque
  'E': 0.55, // Chimie - Secteur à risque modéré-élevé
  'F': 0.40, // Bois/textile
  'G': 0.20, // Commerces non alimentaires - Secteur à très faible risque
  'H': 0.30, // Services aux entreprises
  'I': 0.35  // Services à la personne
};

// Coefficients par montant de garantie
const GUARANTEE_COEFFICIENTS: Record<number, number> = {
  5000: 0.8,   // Garantie faible
  10000: 0.9,  // Garantie modérée
  20000: 1.0,  // Garantie standard (référence)
  30000: 1.1,  // Garantie élevée
  50000: 1.2,  // Garantie très élevée
  75000: 1.3,  // Garantie premium
  100000: 1.4, // Garantie premium+
  150000: 1.5, // Garantie haut de gamme
  200000: 1.6  // Garantie maximale
};

// Coefficients IPP
const IPP_COEFFICIENTS: Record<string, number> = {
  'IP3 & IP4': 1.0,     // Couverture complète (référence)
  'IP4_seul': 0.85      // Couverture partielle - réduction tarifaire
};

// Coefficients sectoriels supplémentaires (multiplicateurs de risque)
const SECTOR_RISK_MULTIPLIERS: Record<string, number> = {
  'A': 1.1,  // Métallurgie - risque modéré
  'B': 1.4,  // BTP - risque très élevé
  'C': 1.0,  // Transports - risque standard
  'D': 0.8,  // Services/commerces - risque faible
  'E': 1.2,  // Chimie - risque élevé
  'F': 1.0,  // Bois/textile - risque standard
  'G': 0.7,  // Commerces - risque très faible
  'H': 0.9,  // Services entreprises - risque faible
  'I': 0.9   // Services personne - risque faible
};

// Tranches d'effectifs avec coefficients progressifs
const EMPLOYEE_BRACKETS = [
  { min: 1, max: 9, coefficient: 1.2 },      // TPE - surcoût administratif
  { min: 10, max: 49, coefficient: 1.0 },    // PE - tarif de référence
  { min: 50, max: 199, coefficient: 0.9 },   // ME - économie d'échelle
  { min: 200, max: 499, coefficient: 0.8 },  // GE - forte économie d'échelle
  { min: 500, max: Infinity, coefficient: 0.7 } // TGE - tarif négocié
];

/**
 * Calcule le coefficient basé sur le nombre d'employés
 */
function getEmployeeBracketCoefficient(employeeCount: number): number {
  const bracket = EMPLOYEE_BRACKETS.find(b => employeeCount >= b.min && employeeCount <= b.max);
  return bracket ? bracket.coefficient : 1.0;
}

/**
 * Validations métier spécifiques
 */
function validateBusinessRules(data: QuestionnaireData): string[] {
  const errors: string[] = [];

  // Validation cohérence effectif/garantie
  if (data.employees_count <= 10 && data.guarantee_amount > 100000) {
    errors.push('Le montant de garantie semble disproportionné pour un effectif de ' + data.employees_count + ' employés');
  }

  // Validation secteur BTP avec garanties élevées
  if (data.ctn_code === 'B' && data.guarantee_amount < 30000) {
    errors.push('Pour le secteur BTP, nous recommandons une garantie d\'au moins 30 000€');
  }

  // Validation IPP historique cohérente
  if (data.had_ip_gt_10_last_4y && data.ipp_type === 'IP4_seul') {
    errors.push('Avec un historique d\'IPP >10%, nous recommandons une couverture IP3 & IP4 complète');
  }

  return errors;
}

/**
 * Fonction principale de calcul tarifaire
 */
export function calculateTariff(data: QuestionnaireData): CalculationResult {
  const errors: string[] = [];

  // === VALIDATIONS DE BASE ===
  if (!data.employees_count || data.employees_count < 1) {
    errors.push('Le nombre d\'employés doit être supérieur à 0');
  }

  if (data.employees_count > 10000) {
    errors.push('Pour un effectif supérieur à 10 000 employés, veuillez nous contacter directement');
  }

  if (!data.ctn_code || !CTN_BASE_RATES[data.ctn_code]) {
    errors.push('Code CTN invalide ou manquant');
  }

  if (!data.guarantee_amount || !GUARANTEE_COEFFICIENTS[data.guarantee_amount]) {
    errors.push('Montant de garantie invalide ou manquant');
  }

  if (!data.ipp_type || !IPP_COEFFICIENTS[data.ipp_type]) {
    errors.push('Type IPP invalide ou manquant');
  }

  // === VALIDATIONS MÉTIER ===
  if (errors.length === 0) {
    const businessErrors = validateBusinessRules(data);
    errors.push(...businessErrors);
  }

  // Si erreurs critiques, arrêter le calcul
  if (errors.some(error => 
    error.includes('invalide') || 
    error.includes('manquant') || 
    error.includes('supérieur à 0') ||
    error.includes('nous contacter')
  )) {
    return {
      isValid: false,
      errors,
      prime_ht: 0,
      prime_ttc: 0,
      commission_rate: 0,
      commission_amount: 0,
      taux_base: 0,
      coefficient_secteur: 0,
      coefficient_garantie: 0,
      coefficient_ipp: 0,
      coefficient_historique: 0
    };
  }

  // === CALCUL DES COEFFICIENTS ===
  const taux_base = CTN_BASE_RATES[data.ctn_code];
  const coefficient_secteur = SECTOR_RISK_MULTIPLIERS[data.ctn_code];
  const coefficient_garantie = GUARANTEE_COEFFICIENTS[data.guarantee_amount];
  const coefficient_ipp = IPP_COEFFICIENTS[data.ipp_type];
  const coefficient_historique = data.had_ip_gt_10_last_4y ? 1.3 : 1.0;
  const coefficient_effectif = getEmployeeBracketCoefficient(data.employees_count);

  // === CALCUL DE LA PRIME ===
  // Formule : (Effectif × Taux_Base × Coeff_Secteur × Coeff_Effectif) × Coeff_Garantie × Coeff_IPP × Coeff_Historique
  const base_calculation = data.employees_count * taux_base * coefficient_secteur * coefficient_effectif;
  const prime_ht = Math.round(base_calculation * coefficient_garantie * coefficient_ipp * coefficient_historique * 100) / 100;
  
  // Application d'un montant minimum (50€ HT)
  const prime_ht_final = Math.max(prime_ht, 50.00);
  
  // TVA 20%
  const prime_ttc = Math.round(prime_ht_final * 1.20 * 100) / 100;

  // === CALCUL COMMISSION ===
  // Commission progressive selon le montant HT
  let commission_rate: number;
  if (prime_ht_final < 500) {
    commission_rate = 25; // 25% pour petites primes
  } else if (prime_ht_final < 2000) {
    commission_rate = 22; // 22% pour primes moyennes
  } else if (prime_ht_final < 5000) {
    commission_rate = 20; // 20% pour grosses primes
  } else {
    commission_rate = 18; // 18% pour très grosses primes
  }

  const commission_amount = Math.round(prime_ht_final * (commission_rate / 100) * 100) / 100;

  // === RÉSULTAT FINAL ===
  return {
    isValid: true,
    errors, // Peut contenir des avertissements non bloquants
    prime_ht: prime_ht_final,
    prime_ttc,
    commission_rate,
    commission_amount,
    taux_base,
    coefficient_secteur,
    coefficient_garantie,
    coefficient_ipp,
    coefficient_historique,
    details: {
      base_calculation,
      adjustments: {
        secteur: coefficient_secteur,
        garantie: coefficient_garantie,
        ipp: coefficient_ipp,
        historique: coefficient_historique
      }
    }
  };
}

/**
 * Fonction utilitaire pour obtenir les informations sur un CTN
 */
export function getCTNInfo(ctnCode: string): { name: string; riskLevel: 'low' | 'medium' | 'high' | 'very-high'; baseRate: number } | null {
  const ctnNames: Record<string, string> = {
    'A': 'Métallurgie',
    'B': 'Bâtiment et Travaux Publics (BTP)',
    'C': 'Transports, eau gaz électricité, livre et communication',
    'D': 'Services, commerces de bouche, industries de l\'alimentation',
    'E': 'Chimie, caoutchouc, plasturgie',
    'F': 'Bois, ameublement, papier-carton, textile, vêtement',
    'G': 'Commerces non alimentaires',
    'H': 'Services aux entreprises',
    'I': 'Services à la personne et au public'
  };

  const riskLevels: Record<string, 'low' | 'medium' | 'high' | 'very-high'> = {
    'A': 'medium',
    'B': 'very-high',
    'C': 'medium',
    'D': 'low',
    'E': 'high',
    'F': 'medium',
    'G': 'low',
    'H': 'low',
    'I': 'low'
  };

  if (!CTN_BASE_RATES[ctnCode]) {
    return null;
  }

  return {
    name: ctnNames[ctnCode],
    riskLevel: riskLevels[ctnCode],
    baseRate: CTN_BASE_RATES[ctnCode]
  };
}

/**
 * Fonction utilitaire pour simuler plusieurs scénarios
 */
export function simulateScenarios(baseData: QuestionnaireData): {
  current: CalculationResult;
  withoutHistory: CalculationResult;
  higherGuarantee: CalculationResult;
  lowerGuarantee: CalculationResult;
} {
  const current = calculateTariff(baseData);
  
  // Scénario sans historique d'IPP
  const withoutHistory = calculateTariff({
    ...baseData,
    had_ip_gt_10_last_4y: false
  });

  // Scénario avec garantie supérieure
  const guaranteeOptions = [5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000];
  const currentIndex = guaranteeOptions.indexOf(baseData.guarantee_amount);
  const higherGuaranteeAmount = currentIndex < guaranteeOptions.length - 1 ? 
    guaranteeOptions[currentIndex + 1] : baseData.guarantee_amount;
  
  const higherGuarantee = calculateTariff({
    ...baseData,
    guarantee_amount: higherGuaranteeAmount
  });

  // Scénario avec garantie inférieure
  const lowerGuaranteeAmount = currentIndex > 0 ? 
    guaranteeOptions[currentIndex - 1] : baseData.guarantee_amount;
  
  const lowerGuarantee = calculateTariff({
    ...baseData,
    guarantee_amount: lowerGuaranteeAmount
  });

  return {
    current,
    withoutHistory,
    higherGuarantee,
    lowerGuarantee
  };
}

export default calculateTariff;