"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { createOrganizerAccount } from "@/actions/admin-organizer.actions";
import { toast } from "sonner";
import { IconLoader2, IconPlus } from "@tabler/icons-react";

export function CreateOrganizerDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        organizerName: "",
        organizerEmail: "",
        phoneNumber: "",
        address: "",
    });

    function reset() {
        setForm({ organizerName: "", organizerEmail: "", phoneNumber: "", address: "" });
    }

    function handleSubmit() {
        startTransition(async () => {
            const res = await createOrganizerAccount(form);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Compte organisateur créé — identifiants envoyés par email.");
            setOpen(false);
            reset();
            router.refresh();
        });
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus className="w-4 h-4" />
                Créer un organisateur
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Créer un compte organisateur</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Nom de l&apos;organisation *</Label>
                            <Input
                                value={form.organizerName}
                                onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={form.organizerEmail}
                                onChange={(e) => setForm({ ...form, organizerEmail: e.target.value })}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Téléphone *</Label>
                            <Input
                                value={form.phoneNumber}
                                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Adresse *</Label>
                            <Input
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                disabled={isPending}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Un mot de passe temporaire est généré automatiquement
                            et envoyé par email — assurez-vous que
                            l&apos;organisateur a déjà donné son accord.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
                            {isPending && <IconLoader2 className="w-4 h-4 animate-spin" />}
                            {isPending ? "Création…" : "Créer et envoyer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
