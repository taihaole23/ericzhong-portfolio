"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import CharacterGrid from './CharacterGrid';
import { Stroke, PenType } from '@/types/types';
import styles from './Editor.module.css';
import { generateFont, generateFontDataURL } from '@/utils/font-maker/fontGenerator';
import FontPreview from './FontPreview';
import ExportModal from './ExportModal';
import './font-maker-theme.css';

const CATEGORIES = {
    Uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    Lowercase: "abcdefghijklmnopqrstuvwxyz",
    Numbers: "0123456789",
    Symbols: "!@#$%^&*()_+-=[]{}|;':\",./<>?`~"
};

type CategoryName = keyof typeof CATEGORIES;
type Theme = 'light' | 'dark';

const Editor: React.FC = () => {
    const [activeChar, setActiveChar] = useState<string>('A');
    const [fontData, setFontData] = useState<Record<string, Stroke[]>>({});
    const [history, setHistory] = useState<Record<string, Stroke[][]>>({});
    const [penType, setPenType] = useState<PenType>('normal');
    const [autoScale, setAutoScale] = useState<boolean>(false);
    const [theme, setTheme] = useState<Theme>('light');
    const [strokeWidth, setStrokeWidth] = useState<number>(8);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [previewBold, setPreviewBold] = useState(false);

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const allChars = useMemo(() => {
        return (
            CATEGORIES.Uppercase +
            CATEGORIES.Lowercase +
            CATEGORIES.Numbers +
            CATEGORIES.Symbols
        );
    }, []);

    const handleNextEmpty = useCallback(() => {
        const currentIndex = allChars.indexOf(activeChar);
        if (currentIndex === -1) return;

        let found = false;
        for (let i = currentIndex + 1; i < allChars.length; i++) {
            const char = allChars[i];
            if (!fontData[char] || fontData[char].length === 0) {
                setActiveChar(char);
                found = true;
                break;
            }
        }
        if (!found) {
            for (let i = 0; i < currentIndex; i++) {
                const char = allChars[i];
                if (!fontData[char] || fontData[char].length === 0) {
                    setActiveChar(char);
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            handleStep(1);
        }
    }, [activeChar, allChars, fontData]);

    const handleStep = useCallback((step: number) => {
        const currentIndex = allChars.indexOf(activeChar);
        if (currentIndex === -1) return;

        let nextIndex = (currentIndex + step) % allChars.length;
        if (nextIndex < 0) nextIndex += allChars.length;

        setActiveChar(allChars[nextIndex]);
    }, [activeChar, allChars]);

    const handleUndo = useCallback(() => {
        const charHistory = history[activeChar] || [];
        if (charHistory.length === 0) return;

        const newHistoryStack = [...charHistory];
        const previousState = newHistoryStack.pop();

        if (previousState !== undefined) {
            setHistory(prev => ({
                ...prev,
                [activeChar]: newHistoryStack
            }));

            setFontData(prev => ({
                ...prev,
                [activeChar]: previousState
            }));
        }
    }, [activeChar, history]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            // if ((e.target as HTMLElement).tagName === 'SELECT') return; // No select anymore

            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleUndo();
                return;
            }

            switch (e.key) {
                case 'ArrowRight':
                    handleStep(1);
                    break;
                case 'ArrowLeft':
                    handleStep(-1);
                    break;
                case ' ':
                    e.preventDefault();
                    handleNextEmpty();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleStep, handleNextEmpty, handleUndo]);

    const handleStrokesChange = (newStrokes: Stroke[]) => {
        const currentStrokes = fontData[activeChar] || [];

        setHistory(prev => ({
            ...prev,
            [activeChar]: [...(prev[activeChar] || []), currentStrokes]
        }));

        setFontData(prev => ({
            ...prev,
            [activeChar]: newStrokes
        }));
    };

    const handleClear = () => {
        if (confirm(`Clear drawing for ${activeChar}?`)) {
            setHistory(prev => ({
                ...prev,
                [activeChar]: [...(prev[activeChar] || []), fontData[activeChar] || []]
            }));

            setFontData(prev => ({
                ...prev,
                [activeChar]: []
            }));
        }
    };

    const handleExport = (metadata: {
        familyName: string;
        styleName: string;
        author: string;
        version: string;
        includeBold: boolean;
    }) => {
        try {
            // 1. Export the Regular version
            generateFont(fontData, {
                autoScale,
                familyName: metadata.familyName,
                styleName: metadata.styleName,
                author: metadata.author,
                version: metadata.version
            });

            // 2. Export Bold version if requested
            if (metadata.includeBold) {
                // Short delay to avoid browser blocking multiple downloads
                setTimeout(() => {
                    generateFont(fontData, {
                        autoScale,
                        familyName: metadata.familyName,
                        styleName: 'Bold',
                        author: metadata.author,
                        version: metadata.version,
                        weightMultiplier: 2.5 // Adjusted for cleaner bold
                    });
                }, 500);
            }

            setIsExportModalOpen(false);
        } catch (e) {
            console.error("Export failed", e);
            alert("Failed to export font. See console for details.");
        }
    };

    const handleRefreshPreview = async () => {
        setIsPreviewLoading(true);
        try {
            const url = await generateFontDataURL(fontData, {
                autoScale,
                weightMultiplier: previewBold ? 2.5 : 1.0
            });
            if (url) {
                // If there was a previous URL, revoke it to avoid memory leaks
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(url);
            }
        } catch (e) {
            console.error("Preview failed", e);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const currentStrokes = fontData[activeChar] || [];

    return (
        <div className={`${styles.container} font-maker-wrapper`}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Font Maker</h1>
                    <p className={styles.subtitle}>Design your custom font</p>
                </div>

                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Tools</label>
                        <div className={styles.buttonGroup}>
                            <button
                                onClick={() => setPenType('normal')}
                                className={`${styles.toolButton} ${penType === 'normal' ? styles.toolButtonActive : ''}`}
                            >
                                Normal
                            </button>
                            <button
                                onClick={() => setPenType('calligraphy')}
                                className={`${styles.toolButton} ${penType === 'calligraphy' ? styles.toolButtonActive : ''}`}
                            >
                                Calligraphy
                            </button>
                            <button
                                onClick={() => setPenType('eraser')}
                                className={`${styles.toolButton} ${penType === 'eraser' ? styles.toolButtonActive : ''}`}
                            >
                                Eraser
                            </button>
                        </div>
                    </div>

                    {/* Stroke Width Control */}
                    {penType === 'normal' && (
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>
                                Stroke Width: {strokeWidth}px
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="20"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>
                    )}

                    <div className={styles.controlGroup}>
                        <button
                            onClick={handleClear}
                            className={styles.clearButton}
                        >
                            Clear Current Char
                        </button>
                    </div>

                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Export Options</label>
                        <label className={styles.toggleLabel}>
                            <div className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={autoScale}
                                    onChange={(e) => setAutoScale(e.target.checked)}
                                />
                                <span className={styles.sliderToggle}></span>
                            </div>
                            <span>Auto-scale to fit</span>
                        </label>
                    </div>
                </div>

                <div className={styles.gridContainer}>
                    <div className={styles.gridContent}>
                        {(Object.entries(CATEGORIES) as [CategoryName, string][]).map(([category, chars]) => (
                            <div key={category} style={{ marginBottom: '1.5rem' }}>
                                <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>{category}</label>
                                <CharacterGrid
                                    activeChar={activeChar}
                                    onSelectChar={setActiveChar}
                                    data={fontData}
                                    chars={chars}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        onClick={handleRefreshPreview}
                        className={styles.toolButton}
                        style={{ marginBottom: '0.5rem', width: '100%', backgroundColor: 'var(--bg-workspace)' }}
                        disabled={isPreviewLoading}
                    >
                        {isPreviewLoading ? 'Generating...' : 'Refresh Preview'}
                    </button>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className={styles.exportButton}
                    >
                        Export Font
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className={styles.workspace}>
                <div className={styles.sidePanel}>
                    <button
                        onClick={() => handleStep(-1)}
                        className={styles.navButton}
                        title="Previous Character (Left Arrow)"
                    >
                        &larr;
                    </button>
                </div>

                <div className={styles.canvasColumn}>
                    <div className={styles.canvasWrapper}>
                        <div className={styles.canvasLabel}>
                            Editing: <span className={styles.activeChar}>{activeChar}</span>
                        </div>

                        <button
                            className={styles.undoButton}
                            onClick={handleUndo}
                            title="Undo (Ctrl+Z)"
                        >
                            <span>&#8617;</span> Undo
                        </button>

                        {/* Reference Character Overlay */}
                        <div className={styles.referenceOverlay}>
                            <span className={styles.referenceChar} style={{
                                // Adjust vertical align for descenders?
                                // Simple centering is usually good enough for reference
                                transform: 'translateY(-20px)'
                            }}>
                                {activeChar}
                            </span>
                        </div>

                        <Canvas
                            width={600}
                            height={600}
                            penType={penType}
                            strokeWidth={strokeWidth}
                            strokes={currentStrokes}
                            onStrokesChange={handleStrokesChange}
                            theme={theme}
                        />
                    </div>
                    <p className={styles.instructions}>
                        Shortcuts: <b>Arrows</b> to navigate, <b>Space</b> for next empty, <b>Ctrl+Z</b> to undo.
                    </p>

                    <div className={styles.previewControls} style={{ marginTop: '1rem' }}>
                        <label className={styles.toggleLabel}>
                            <div className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={previewBold}
                                    onChange={(e) => setPreviewBold(e.target.checked)}
                                />
                                <span className={styles.sliderToggle}></span>
                            </div>
                            <span>Preview Bold Version (2.5x)</span>
                        </label>
                    </div>

                    <FontPreview fontUrl={previewUrl} />
                </div>

                <div className={styles.sidePanel}>
                    <button
                        onClick={() => handleStep(1)}
                        className={styles.navButton}
                        title="Next Character (Right Arrow)"
                    >
                        &rarr;
                    </button>
                </div>
            </div>

            {/* Theme Toggle FAB */}
            <button
                className={styles.themeToggle}
                onClick={toggleTheme}
                title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
                {theme === 'light' ? '☀️' : '🌙'}
            </button>

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
            />
        </div>
    );
};

export default Editor;
