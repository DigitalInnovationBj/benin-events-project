declare module "react-qr-scanner" {
    import { Component, CSSProperties } from "react";

    interface QrScannerProps {
        onScan: (data: string | null) => void;
        onError: (error: unknown) => void;
        onLoad?: () => void;
        delay?: number | false;
        facingMode?: "front" | "rear";
        legacyMode?: boolean;
        style?: CSSProperties;
        className?: string;
        chooseDeviceId?: (
            filtered: MediaDeviceInfo[],
            all: MediaDeviceInfo[],
        ) => string;
    }

    export default class QrReader extends Component<QrScannerProps> {
        openImageDialog(): void;
    }
}
