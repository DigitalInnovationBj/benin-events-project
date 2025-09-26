"use client";
import { FeexPayProvider, FeexPayButton } from "@feexpay/react-sdk";
import '@feexpay/react-sdk/style.css'

export default function PaiementPage() {
  return (
    <div className="container mx-auto p-4">
      <FeexPayProvider>
        <FeexPayButton
          // Montant de la transaction en XOF
          amount={100}
          // Description affichée dans la modale de paiement
          description="Test Payment"
          // Clé API sécurisée : SANDBOX pour test, LIVE pour production
          token="fp_QPZX1HXtZ2nIRToe82T0e9BgRqgRx8X5scuWnztVKVKRGooqhzTd8RcWBE5leOPH"
          // ID de la boutique
          id="67f38990d03aacc00ca69667"
          // Référence personnalisée (chaîne aléatoire unique)
          customId="23455"
          // URL de redirection en cas d’échec du paiement (optionnel)
          // error_callback_url="https://example.com/callback/error"
          // URL de redirection après succès du paiement (optionnel si callback utilisé)
          callback_url="http://localhost:3000/api/paiement"
          // Mode de paiement : "SANDBOX" (test) ou "LIVE" (production)
          mode="SANDBOX"
          // Champs à cacher dans le formulaire de paiement (optionnel)
          // fields_to_hide={["email", "name"]}
          // Fonction appelée après le paiement (réussi ou échoué)
          callback={async (response) => {
            console.log(response);
            await fetch(`/api/paiement?reference=${response.reference}`, {
              method: "GET",
            })
              .then((res) => res.json())
              .then((data) => {
                console.log("Payment verification data:", data);
                // Gérer la réponse de la vérification du paiement ici
              })
              .catch((error) => {
                console.error("Error verifying payment:", error);
              });
          }}
          callback_info={{
            userId: "12345",
            eventId: "67890",
            dateId: "54321",
          }}
          // Texte du bouton (optionnel si tu veux un texte personnalisé)
          buttonText="Payer maintenant"
          // Style personnalisé du bouton (CSS classes Tailwind)
          buttonClass="bg-primary-blue hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
          // Type de paiement : MOBILE, CARD, WALLET (Laisser vide pour afficher les trois)
          case=""
          // Devise utilisée pour la transaction (ex: XOF, USD, CAD, XAF)
          currency="XOF"
        />
      </FeexPayProvider>
    </div>
  );
}
