import { getCurrentUser } from "@/lib/permissions";
import NavbarClient from "./NavbarClient";

export default async function Header() {
    const sessionUser = await getCurrentUser();

    const user = sessionUser
        ? {
              name: sessionUser.name,
              email: sessionUser.email,
              image: sessionUser.image,
              role: sessionUser.role as string,
          }
        : null;

    return <NavbarClient user={user} />;
}
