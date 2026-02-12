"use client";

import React, { useState } from 'react';
import styles from './ExportModal.module.css';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (metadata: {
        familyName: string;
        styleName: string;
        author: string;
        version: string;
        includeBold: boolean;
    }) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
    const [familyName, setFamilyName] = useState('MyCustomFont');
    const [styleName, setStyleName] = useState('Regular');
    const [author, setAuthor] = useState('');
    const [version, setVersion] = useState('1.000');
    const [includeBold, setIncludeBold] = useState(false);

    // Track where mouse starts to prevent closing when dragging selection out
    const mouseDownOnOverlay = React.useRef(false);

    if (!isOpen) return null;

    const handleOverlayMouseDown = (e: React.MouseEvent) => {
        mouseDownOnOverlay.current = e.target === e.currentTarget;
    };

    const handleOverlayMouseUp = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && mouseDownOnOverlay.current) {
            onClose();
        }
        mouseDownOnOverlay.current = false;
    };

    return (
        <div
            className={styles.overlay}
            onMouseDown={handleOverlayMouseDown}
            onMouseUp={handleOverlayMouseUp}
        >
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Export Font Settings</h2>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Font Family Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={familyName}
                            onChange={e => setFamilyName(e.target.value)}
                            placeholder="e.g. My Handwriting"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Style Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={styleName}
                            onChange={e => setStyleName(e.target.value)}
                            placeholder="e.g. Regular, Bold, Italic"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Author / Designer</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={author}
                                onChange={e => setAuthor(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Version</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={version}
                                onChange={e => setVersion(e.target.value)}
                                placeholder="1.000"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={includeBold}
                                onChange={e => setIncludeBold(e.target.checked)}
                            />
                            <span>Include Bold Variant (2.5x)</span>
                        </label>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.secondaryButton} onClick={onClose}>Cancel</button>
                    <button
                        className={styles.primaryButton}
                        onClick={() => onExport({ familyName, styleName, author, version, includeBold })}
                    >
                        Generate & Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
