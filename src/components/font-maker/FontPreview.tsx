"use client";

import React, { useEffect, useState } from 'react';
import styles from './Editor.module.css';

interface FontPreviewProps {
    fontUrl: string | null;
}

const FontPreview: React.FC<FontPreviewProps> = ({ fontUrl }) => {
    const [previewText, setPreviewText] = useState("The quick brown fox jumps over the lazy dog.");

    useEffect(() => {
        if (!fontUrl) return;

        // Create a style element for the @font-face
        const styleId = 'preview-font-style';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            @font-face {
                font-family: 'PreviewFont';
                src: url('${fontUrl}') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
        `;

        return () => {
            // Clean up could happen here, but since URLs are blobs, we might want to keep the one from Editor
        };
    }, [fontUrl]);

    if (!fontUrl) {
        return (
            <div className={styles.previewPlaceholder}>
                Click "Refresh Preview" to see your font in action!
            </div>
        );
    }

    return (
        <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
                <span className={styles.label}>Font Preview</span>
                <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className={styles.previewInput}
                    placeholder="Type here to test..."
                />
            </div>
            <div className={styles.previewDisplay} style={{ fontFamily: 'PreviewFont' }}>
                {previewText || "Your custom font will appear here..."}
            </div>
            <div className={styles.previewInfo}>
                This is a live preview of your drawn characters. Any character not yet drawn will use the system font.
            </div>
        </div>
    );
};

export default FontPreview;
