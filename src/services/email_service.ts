// Service pour l'envoi d'emails contractuels

export interface ContractualDocumentData {
  email: string;
  siren: string;
  employees_count: number;
  ctn_code: string;
  guarantee_amount: number;
  courtier?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendContractualDocuments(data: ContractualDocumentData): Promise<EmailResult> {
  try {
    console.log('📧 Préparation envoi documents contractuels pour:', data.email);
    
    // Simulation d'un appel API pour l'envoi d'email
    // En production, remplacer par un vrai service d'email (SendGrid, Mailgun, etc.)
    
    const emailPayload = {
      to: data.email,
      subject: 'Documents contractuels - Atexya Cash',
      template: 'contractual_documents',
      data: {
        siren: data.siren,
        employees_count: data.employees_count,
        ctn_code: data.ctn_code,
        guarantee_amount: data.guarantee_amount,
        courtier: data.courtier || 'Non spécifié',
        timestamp: new Date().toISOString()
      }
    };

    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation de succès (90% de chance de succès)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ Documents envoyés avec succès, ID:', messageId);
      
      return {
        success: true,
        messageId
      };
    } else {
      console.log('❌ Échec simulation envoi email');
      return {
        success: false,
        error: 'Erreur de simulation d\'envoi'
      };
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des documents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// Fonction pour envoyer un email de notification
export async function sendNotificationEmail(
  to: string,
  subject: string,
  content: string
): Promise<EmailResult> {
  try {
    console.log('📧 Envoi notification à:', to);
    
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const messageId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur envoi notification'
    };
  }
}

export default { sendContractualDocuments, sendNotificationEmail };