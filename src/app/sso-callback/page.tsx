"use client";

import { Suspense } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

function SSOCallbackContent() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

    return (
        <AuthenticateWithRedirectCallback
            signInForceRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
        />
    );
}

export default function SSOCallbackPage() {
    return (
        <Suspense>
            <SSOCallbackContent />
        </Suspense>
    );
}
