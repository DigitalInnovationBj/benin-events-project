import { getSettings } from "@/actions/settings.actions";
import { SettingsForm } from "./SettingsForm";

export default async function AdminSettingsPage() {
    const settings = await getSettings();

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-afo mb-2">Paramètres</h1>
            <p className="text-muted-foreground text-sm mb-8">
                Configuration globale de la plateforme.
            </p>

            <div className="bg-card border rounded-xl p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold mb-1">Commission organisateurs</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Pourcentage prélevé sur le CA brut de chaque organisateur lors du reversement des fonds.
                        Actuellement <span className="font-bold text-foreground">{settings.commissionRate}%</span>.
                    </p>
                    <SettingsForm
                        currentRate={settings.commissionRate}
                        physicalRate={settings.physicalCommissionRate}
                        eventCreationFeeEnabled={settings.eventCreationFeeEnabled}
                        eventCreationFee={settings.eventCreationFee}
                        featuredEventFeeEnabled={settings.featuredEventFeeEnabled}
                        featuredEventFee={settings.featuredEventFee}
                    />
                </div>
            </div>
        </div>
    );
}
