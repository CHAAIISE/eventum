"use client";

import React from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QrDisplayProps {
    payload: string | object | null;
    size?: number;
}

const QrDisplay: React.FC<QrDisplayProps> = ({ payload, size = 256 }) => {
    if (!payload) {
        return (
            <div className="flex items-center justify-center w-full h-full text-gray-500">
                No Data
            </div>
        );
    }

    const qrValue = typeof payload === "string" ? payload : JSON.stringify(payload);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
            <QRCodeCanvas
                value={qrValue}
                size={size}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={true}
            />
        </div>
    );
};

export default QrDisplay;
