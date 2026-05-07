"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SSOCallbackPage() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

    return (
        <AuthenticateWithRedirectCallback
            signInForceRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
        />
    );
}
