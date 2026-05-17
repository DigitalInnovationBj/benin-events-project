"use client";

import { cn } from "@/lib/utils";

type Template = "PRIMARY" | "SECONDARY";

interface TicketTemplateSelectorProps {
    value: Template;
    onChange: (value: Template) => void;
}

const TEMPLATES: {
    id: Template;
    label: string;
    description: string;
    headerBg: string;
    headerText: string;
    accent: string;
    rightBg: string;
}[] = [
    {
        id: "PRIMARY",
        label: "Violet & Or",
        description: "En-tête violet, accents dorés",
        headerBg: "#3B0458",
        headerText: "#FAAD29",
        accent: "#FAAD29",
        rightBg: "#F5EEFF",
    },
    {
        id: "SECONDARY",
        label: "Or & Violet",
        description: "En-tête doré, accents violets",
        headerBg: "#FAAD29",
        headerText: "#3B0458",
        accent: "#3B0458",
        rightBg: "#FFF8E7",
    },
];

export function TicketTemplateSelector({ value, onChange }: TicketTemplateSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((tpl) => (
                <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onChange(tpl.id)}
                    className={cn(
                        "rounded-xl border-2 overflow-hidden text-left transition-all",
                        value === tpl.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-muted hover:border-muted-foreground/40",
                    )}
                >
                    {/* Miniature ticket horizontal */}
                    <div className="flex h-16">
                        {/* Bloc gauche coloré */}
                        <div
                            className="flex-1 flex flex-col justify-between p-2"
                            style={{ backgroundColor: tpl.headerBg }}
                        >
                            <span
                                className="text-[8px] font-bold tracking-widest uppercase"
                                style={{ color: tpl.headerText, fontFamily: "serif" }}
                            >
                                Benin Events
                            </span>
                            <div>
                                <div
                                    className="h-1.5 w-3/4 rounded-full mb-1"
                                    style={{ backgroundColor: tpl.headerText, opacity: 0.9 }}
                                />
                                <div
                                    className="h-1 w-1/2 rounded-full"
                                    style={{ backgroundColor: tpl.headerText, opacity: 0.5 }}
                                />
                            </div>
                            <span
                                className="text-[7px] font-semibold"
                                style={{ color: tpl.accent }}
                            >
                                5 000 FCFA
                            </span>
                        </div>

                        {/* Séparateur pointillé */}
                        <div
                            className="w-px my-2 border-l-2 border-dashed"
                            style={{ borderColor: tpl.accent }}
                        />

                        {/* Bloc droit QR */}
                        <div
                            className="w-12 flex items-center justify-center"
                            style={{ backgroundColor: tpl.rightBg }}
                        >
                            <div className="w-7 h-7 bg-white rounded p-0.5">
                                <QrPlaceholder color={tpl.accent} />
                            </div>
                        </div>
                    </div>

                    {/* Label */}
                    <div className="px-3 py-2 bg-background">
                        <p className="text-xs font-semibold">{tpl.label}</p>
                        <p className="text-[10px] text-muted-foreground">{tpl.description}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}

function QrPlaceholder({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="9" height="9" rx="1" fill={color} />
            <rect x="2" y="2" width="5" height="5" rx="0.5" fill="white" />
            <rect x="3" y="3" width="3" height="3" fill={color} />
            <rect x="12" y="0" width="9" height="9" rx="1" fill={color} />
            <rect x="14" y="2" width="5" height="5" rx="0.5" fill="white" />
            <rect x="15" y="3" width="3" height="3" fill={color} />
            <rect x="0" y="12" width="9" height="9" rx="1" fill={color} />
            <rect x="2" y="14" width="5" height="5" rx="0.5" fill="white" />
            <rect x="3" y="15" width="3" height="3" fill={color} />
            <rect x="12" y="12" width="3" height="3" fill={color} />
            <rect x="17" y="12" width="4" height="3" fill={color} />
            <rect x="12" y="17" width="4" height="4" fill={color} />
            <rect x="18" y="16" width="3" height="5" fill={color} />
        </svg>
    );
}
