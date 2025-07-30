import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, CheckCircle, AlertCircle, Loader2, Building, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateTariff, QuestionnaireData } from '../utils/tariffCalculator';
import { usePappersSearch, usePappersValidation } from '../hooks/usePappers';
import { sendContractualDocuments } from '../services/emailService';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuoteModal = ({ isOpen, onClose }: QuoteModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  // États pour l'intégration Pappers
  const [sirenInput, setSirenInput] = useState('');
  const [companyDataFetched, setCompanyDataFetched] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  
  // Hooks Pappers
  const pappers = usePappersSearch();
  const { validateInput } = usePappersValidation();

  // Validation en temps réel du SIREN
  const sirenValidation = validateInput(sirenInput);

  // Recherche automatique quand un SIREN valide est saisi
  useEffect(() => {
    if (sirenValidation.isValid && sirenInput.length >= 9 && !companyDataFetched) {
      handleSirenSearch();
    }
  }, [sirenInput, sirenValidation.isValid, companyDataFetched]);

  const handleSirenSearch = async () => {
    if (!sirenValidation.isValid) return;
    
    try {
      const result = await pappers.search(sirenInput);
      if (result) {
        setCompanyInfo(result);
        setCompanyDataFetched(true);
        toast.success('Informations entreprise récupérées !');
      }
    } catch (error) {
      toast.error('Impossible de récupérer les informations de l\'entreprise');
    }
  };

  const handleSirenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setSirenInput(value);
    setCompanyDataFetched(false);
    setCompanyInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!privacyAccepted) {
      toast.error('Vous devez accepter la politique de confidentialité pour continuer.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    const formData = new FormData(e.currentTarget);
    
    const data = {
      siren: sirenInput,
      employees_count: parseInt(formData.get('employees_count') as string),
      ctn_code: formData.get('ctn_code'),
      guarantee_amount: parseInt(formData.get('guarantee_amount') as string),
      ipp_type: formData.get('ipp_type'),
      had_ip_gt_10_last_4y: formData.get('had_ip_gt_10_last_4y') === 'on',
      email: formData.get('email'),
      courtier: formData.get('courtier'),
      broker_id: formData.get('broker_id'),
      company_info: companyInfo,
      pappers_data: companyInfo ? {
        raison_sociale: companyInfo.company_data.raison_sociale,
        adresse_legale: companyInfo.company_data.adresse_legale,
        effectif_pappers: companyInfo.company_data.effectif_salaries,
        forme_juridique: companyInfo.company_data.forme_juridique,
        code_ape: companyInfo.company_data.code_ape,
        activite_principale: companyInfo.company_data.activite_principale,
        dirigeants: companyInfo.executives || []
      } : null
    };

    // Calcul du tarif en local
    const questionnaireData: QuestionnaireData = {
      employees_count: data.employees_count,
      ctn_code: data.ctn_code as string,
      guarantee_amount: data.guarantee_amount,
      ipp_type: data.ipp_type as string,
      had_ip_gt_10_last_4y: data.had_ip_gt_10_last_4y
    };

    const calculationResult = calculateTariff(questionnaireData);

    if (!calculationResult.isValid) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      
      const errorMessage = calculationResult.errors.join(' ');
      toast.error(errorMessage);
      return;
    }

    // Simulation d'un délai de traitement
    setTimeout(async () => {
      setSubmitStatus('success');
      
      // Stocker les données de calcul
      sessionStorage.setItem('atexya_calculation', JSON.stringify({
        questionnaireData,
        calculationResult,
        formData: data
      }));
      
      // Envoi des documents
      try {
        const emailResult = await sendContractualDocuments({
          email: data.email as string,
          siren: data.siren,
          employees_count: data.employees_count,
          ctn_code: data.ctn_code as string,
          guarantee_amount: data.guarantee_amount,
          courtier: data.courtier as string
        });
        
        if (emailResult.success) {
          toast.success('Documents contractuels envoyés par email !');
        } else {
          toast.error('Erreur lors de l\'envoi des documents.');
        }
      } catch (error) {
        toast.error('Problème technique lors de l\'envoi des documents.');
      }
      
      toast.success('Votre simulation a été calculée avec succès !');

      setTimeout(() => {
        onClose();
        
        if (data.ctn_code === 'B') {
          window.location.href = '/#/ctn-b';
        } else {
          window.location.href = '/#/calcul-en-cours';
        }
      }, 2000);
      
      setIsSubmitting(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-garamond text-primary">
              Demande de simulation
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="siren" className="block text-sm font-medium text-gray-700 mb-1">
                SIREN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="siren"
                  name="siren"
                  value={sirenInput}
                  onChange={handleSirenChange}
                  required
                  placeholder="123456789"
                  maxLength={9}
                  className={`w-full p-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                    sirenInput.length > 0 
                      ? sirenValidation.isValid 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {pappers.loading ? (
                    <Loader2 className="h-5 w-5 text-gold animate-spin" />
                  ) : sirenInput.length > 0 ? (
                    sirenValidation.isValid ? (
                      companyDataFetched ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Search className="h-5 w-5 text-gold" />
                      )
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )
                  ) : (
                    <Building className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {sirenInput.length > 0 && !sirenValidation.isValid && (
                <p className="mt-1 text-sm text-red-600">
                  {sirenValidation.error}
                </p>
              )}
              
              {pappers.error && (
                <p className="mt-1 text-sm text-red-600">
                  {pappers.error}
                </p>
              )}
              
              {companyInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Entreprise trouvée
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p className="font-medium">{companyInfo.company_data.raison_sociale}</p>
                    {companyInfo.company_data.adresse_legale && (
                      <p className="text-xs mt-1">{companyInfo.company_data.adresse_legale}</p>
                    )}
                    {companyInfo.company_data.effectif_salaries && (
                      <p className="text-xs mt-1">
                        Effectif: {companyInfo.company_data.effectif_salaries} salarié(s)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="employees_count" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre d'employés <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="employees_count"
                name="employees_count"
                required
                min="1"
                placeholder="Ex: 50"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
              />
            </div>

            <div>
              <label htmlFor="ctn_code" className="block text-sm font-medium text-gray-700 mb-1">
                Secteur d'activité principal <span className="text-red-500">*</span>
              </label>
              <select
                id="ctn_code"
                name="ctn_code"
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold bg-white transition-colors"
              >
                <option value="">Sélectionnez votre secteur d'activité</option>
                <option value="A">A - Métallurgie</option>
                <option value="B">B - Bâtiment et Travaux Publics (BTP)</option>
                <option value="C">C - Transports, eau gaz électricité, livre et communication</option>
                <option value="D">D - Services, commerces de bouche, industries de l'alimentation, supermarchés</option>
                <option value="E">E - Chimie, caoutchouc, plasturgie</option>
                <option value="F">F - Bois, ameublement, papier-carton, textile, vêtement, cuirs et peaux, terres à feu</option>
                <option value="G">G - Commerces non alimentaires (bricolage, vêtements, électroménager, optique, décoration, papeterie)</option>
                <option value="H">H - Services aux entreprises (nettoyage industriel, sécurité, gardiennage, intérim, maintenance)</option>
                <option value="I">I - Services à la personne et au public (crèches, maisons de retraite, aide à domicile, associations, centres sociaux)</option>
              </select>
            </div>

            <div>
              <label htmlFor="guarantee_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Montant de garantie souhaité <span className="text-red-500">*</span>
              </label>
              <select
                id="guarantee_amount"
                name="guarantee_amount"
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold bg-white transition-colors"
              >
                <option value="">Sélectionnez un montant</option>
                <option value="5000">5 000 €</option>
                <option value="10000">10 000 €</option>
                <option value="20000">20 000 €</option>
                <option value="30000">30 000 €</option>
                <option value="50000">50 000 €</option>
                <option value="75000">75 000 €</option>
                <option value="100000">100 000 €</option>
                <option value="150000">150 000 €</option>
                <option value="200000">200 000 €</option>
              </select>
            </div>

            <div>
              <label htmlFor="ipp_type" className="block text-sm font-medium text-gray-700 mb-1">
                Type d'IPP <span className="text-red-500">*</span>
              </label>
              <select
                id="ipp_type"
                name="ipp_type"
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold bg-white transition-colors"
              >
                <option value="">Sélectionnez un type</option>
                <option value="IP3 & IP4">IP3 & IP4</option>
                <option value="IP4_seul">IP4 seul</option>
              </select>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="had_ip_gt_10_last_4y"
                name="had_ip_gt_10_last_4y"
                className="mt-1 h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
              />
              <label htmlFor="had_ip_gt_10_last_4y" className="text-sm text-gray-700 cursor-pointer">
                Avez-vous eu une IPP supérieure à 10% au cours des 4 dernières années ?
              </label>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email professionnel <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="exemple@entreprise.fr"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
              />
            </div>

            <div>
              <label htmlFor="courtier" className="block text-sm font-medium text-gray-700 mb-1">
                Courtier <span className="text-gray-500 text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                id="courtier"
                name="courtier"
                placeholder="Nom du courtier ou cabinet"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
              />
            </div>

            <input type="hidden" name="broker_id" value="" />

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="privacy_policy"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                required
              />
              <label htmlFor="privacy_policy" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">J'ai lu et j'accepte la </span>
                <a 
                  href="/#/politique-confidentialite" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark underline font-medium"
                >
                  politique de confidentialité
                </a>
                <span className="text-red-500 ml-1">*</span>
                <br />
                <span className="text-xs text-gray-500 mt-1 block">
                  En cochant cette case, vous acceptez que vos données personnelles soient traitées 
                  conformément à notre politique de confidentialité.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !privacyAccepted}
              className={`w-full mt-6 py-3 px-6 rounded-md font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                isSubmitting || !privacyAccepted
                  ? 'bg-gray-400 cursor-not-allowed'
                  : submitStatus === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : submitStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary hover:bg-primary-dark'
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Envoyé avec succès !</span>
                </>
              ) : submitStatus === 'error' ? (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Réessayer</span>
                </>
              ) : (
                <span>Recevoir ma simulation</span>
              )}
            </button>

            {!privacyAccepted && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                  <p className="text-sm text-amber-800">
                    Veuillez accepter la politique de confidentialité pour continuer.
                  </p>
                </div>
              </div>
            )}

            {submitStatus === 'success' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800 font-medium">
                    Demande envoyée ! Redirection en cours...
                  </p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">
                      Erreur de calcul
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Vérifiez vos informations et réessayez.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;