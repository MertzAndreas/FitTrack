import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Food } from "../food";
import { useBarcode } from "../use-food-logging";

type BarcodeCameraProps = {
  onSelect: (food: Food) => void;
  onClose: () => void;
};

export const BarcodeCamera = ({ onSelect, onClose }: BarcodeCameraProps) => {
  const { mutate: lookupBarcode, isPending: isLookingUp } = useBarcode();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<{
    code: string;
    found: boolean;
  } | null>(null);

  const handleScan = (codes: Array<{ rawValue: string }>) => {
    const code = codes[0]?.rawValue;
    if (!code || isLookingUp) return;

    setScannedCode(code);
    setLastScan(null);
    lookupBarcode(code, {
      onSuccess: (found) => {
        setLastScan({ code, found: true });
        onSelect(found);
      },
      onError: () => {
        setLastScan({ code, found: false });
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex min-h-10 flex-1 items-center justify-center border bg-muted/50 px-3 text-center text-sm">
          {isLookingUp && scannedCode ? (
            <span>Looking up {scannedCode}…</span>
          ) : lastScan && !lastScan.found ? (
            <span className="text-destructive">
              {lastScan.code} not found in the database
            </span>
          ) : (
            <span className="text-muted-foreground">
              Point the camera at a barcode
            </span>
          )}
        </div>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <Scanner onScan={handleScan} />
    </div>
  );
};
