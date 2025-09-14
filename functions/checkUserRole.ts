"use server";

import { auth } from "@/lib/auth";
import { Role } from "@/lib/generated/prisma";
import { headers } from "next/headers";

export async function CheckUserRole(request: Request, requiredRole: Role) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        // Vérifier si la session existe
        if (!session?.user) {
            return { 
                state: false, 
                user: null, 
                error: "No active session" 
            };
        }

        // Comparaison insensible à la casse des rôles
        const userRole = session.user.role?.toUpperCase();
        const requiredRoleUpper = requiredRole.toUpperCase();

        if (userRole !== requiredRoleUpper) {
            return { 
                state: false, 
                user: session.user, 
                error: "Insufficient permissions" 
            };
        }

        return { 
            state: true, 
            user: session.user, 
            error: null 
        };
    } catch (error) {
        console.error("Error checking user role:", error);
        return { 
            state: false, 
            user: null, 
            error: "Authentication error" 
        };
    }
}