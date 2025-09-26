"use client";
import { FeexPayProvider, FeexPayButton } from '@feexpay/react-sdk';

export default  function PaiementPage() {
  return <div>
    <FeexPayProvider>

  <FeexPayButton 
    // Montant de la transaction en XOF
    amount={100}

    // Description affichée dans la modale de paiement(Veuillez ne pas mettre de caractères spéciaux ni d'accolades {, }, [, ], (, ), _, +, =, ?, /, \, `, ~, [, ], {, }, |, ;, :)
    description="Test Payment"

    // Clé API sécurisée : SANDBOX pour test, LIVE pour production
    token="fp_QPZX1HXtZ2nIRToe82T0e9BgRqgRx8X5scuWnztVKVKRGooqhzTd8RcWBE5leOPH"
    
    // ID de la boutique 
    id="67f38990d03aacc00ca69667"

    // Référence personnalisée (chaîne aléatoire unique)
    customId='23455'

    // URL de redirection en cas d’échec du paiement (optionnel)
    //error_callback_url='https://example.com/callback/error'

    // URL de redirection après succès du paiement (optionnel si callback utilisé)
    // callback_url="https://example.com/callback"

    // Données supplémentaires à associer à la transaction(optionnel)
    callback_info={{
      adress : "123 Main St, Anytown, USA",
      phone : "1234567890",
      email : "test@example.com",
      fullname : "John Doe",
      
    }}

    // Mode de paiement : "SANDBOX" (test) ou "LIVE" (production)
    mode="SANDBOX"

    // Champs à cacher dans le formulaire de paiement (optionnel)
    // fields_to_hide={["email", "name"]}

    // Fonction appelée après le paiement (réussi ou échoué)
    callback={(response) => {
      console.log(response);
    }}

    // Texte du bouton (optionnel si tu veux un texte personnalisé)
    // buttonText="Payer maintenant"

    // Style personnalisé du bouton (CSS classes tailwind ou bootstrap)
    // buttonClass="bg-primary-blue hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"

    // Type de paiement : MOBILE, CARD, WALLET(Laisser vide pour afficher les trois)
    case=''

    // Devise utilisée pour la transaction (ex: XOF, USD, CAD, XAF)
    currency='XOF'
  />

</FeexPayProvider>
  </div>;
}
