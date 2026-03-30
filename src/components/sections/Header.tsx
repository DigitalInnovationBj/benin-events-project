import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import NavbarClient from "./NavbarClient";

export default async function Header() {
    const { userId } = await auth();

    let user: {
        name: string | null;
        email: string;
        image: string | null;
        role: string;
    } | null = null;

    if (userId) {
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { name: true, email: true, image: true, role: true },
        });
        if (dbUser) {
            user = dbUser;
        }
    }

    return <NavbarClient user={user} />;
}
