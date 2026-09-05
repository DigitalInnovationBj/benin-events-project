"use client";

import { useMemo, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { createEventCampaign } from "@/actions/campaign.actions";
import { toast } from "sonner";
import { IconSpeakerphone, IconUpload } from "@tabler/icons-react";

interface CampaignDialogProps {
    eventId: string;
    eventTitle: string;
    remaining: number;
    nextAvailableAt: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractEmails(text: string): string[] {
    const found = text
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => EMAIL_RE.test(s));
    return Array.from(new Set(found));
}

export function isCampaignOnCooldown(remaining: number, nextAvailableAt: string | null): boolean {
    return remaining <= 0 || (!!nextAvailableAt && new Date(nextAvailableAt) > new Date());
}

export function CampaignDialog({
    eventId,
    eventTitle,
    remaining,
    nextAvailableAt,
    open,
    onOpenChange,
}: CampaignDialogProps) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [targetPlatformUsers, setTargetPlatformUsers] = useState(true);
    const [externalRaw, setExternalRaw] = useState("");
    const [fileEmails, setFileEmails] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const pastedEmails = useMemo(() => extractEmails(externalRaw), [externalRaw]);
    const externalEmails = useMemo(
        () => Array.from(new Set([...pastedEmails, ...fileEmails])),
        [pastedEmails, fileEmails],
    );

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const text = rows
                .flat()
                .filter((v) => typeof v === "string" || typeof v === "number")
                .join("\n");
            const emails = extractEmails(String(text));
            setFileEmails(emails);
            setFileName(file.name);
            if (emails.length === 0) {
                toast.error("Aucune adresse email valide trouvée dans ce fichier.");
            }
        } catch {
            toast.error("Impossible de lire ce fichier.");
        }
    };

    const resetForm = () => {
        setSubject("");
        setMessage("");
        setExternalRaw("");
        setFileEmails([]);
        setFileName(null);
    };

    const handleSubmit = () => {
        if (!subject.trim() || !message.trim()) {
            toast.error("Renseignez un sujet et un message.");
            return;
        }
        if (!targetPlatformUsers && externalEmails.length === 0) {
            toast.error(
                "Sélectionnez au moins une cible : utilisateurs de la plateforme ou liste externe.",
            );
            return;
        }

        startTransition(async () => {
            const res = await createEventCampaign({
                eventId,
                subject: subject.trim(),
                message,
                targetPlatformUsers,
                externalEmails,
            });

            if (res.error) {
                toast.error(res.error);
                return;
            }

            const count = res.recipientCount ?? 0;
            toast.success(
                `Campagne lancée — envoi à ${count} destinataire${count > 1 ? "s" : ""} en cours.`,
            );
            onOpenChange(false);
            resetForm();
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Lancer une campagne email</DialogTitle>
                        <DialogDescription>
                            Donnez de la visibilité à « {eventTitle} ». {remaining}{" "}
                            campagne{remaining > 1 ? "s" : ""} restante
                            {remaining > 1 ? "s" : ""} pour cet évènement.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Sujet</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Ex : Plus que 3 jours avant l'évènement !"
                                maxLength={150}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Message</label>
                            <RichTextEditor
                                content={message}
                                onChange={setMessage}
                                placeholder="Votre message aux destinataires…"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={targetPlatformUsers}
                                onChange={(e) => setTargetPlatformUsers(e.target.checked)}
                                className="rounded border-border"
                            />
                            Utilisateurs de la plateforme (inscrits à la newsletter)
                        </label>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Liste externe (optionnel)
                            </label>
                            <textarea
                                value={externalRaw}
                                onChange={(e) => setExternalRaw(e.target.value)}
                                placeholder="Collez des adresses email, séparées par des virgules ou des retours à la ligne…"
                                className="w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                                <input
                                    id="campaign-file"
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={onFileChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="campaign-file"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-muted"
                                >
                                    <IconUpload className="w-3.5 h-3.5" stroke={1.75} />
                                    {fileName ?? "Importer un CSV / XLSX"}
                                </label>
                                {fileName && (
                                    <span className="text-xs text-muted-foreground">
                                        {fileEmails.length} email(s) détecté(s)
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {targetPlatformUsers && "+ utilisateurs de la plateforme · "}
                            {externalEmails.length} adresse
                            {externalEmails.length !== 1 ? "s" : ""} externe
                            {externalEmails.length !== 1 ? "s" : ""} détectée
                            {externalEmails.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending ? "Envoi…" : "Lancer la campagne"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
    );
}
