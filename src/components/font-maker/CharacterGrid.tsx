"use client";

import React from 'react';
import { Stroke } from '@/types/types';
import styles from './CharacterGrid.module.css';

interface CharacterGridProps {
    activeChar: string;
    onSelectChar: (char: string) => void;
    data: Record<string, Stroke[]>;
    chars: string; // New prop for dynamic character list
}

const CharacterGrid: React.FC<CharacterGridProps> = ({ activeChar, onSelectChar, data, chars }) => {
    const charArray = chars.split('');

    return (
        <div className={styles.grid}>
            {charArray.map(char => {
                const hasContent = data[char] && data[char].length > 0;
                let className = styles.charButton;
                if (char === activeChar) {
                    className += ` ${styles.active}`;
                } else if (hasContent) {
                    className += ` ${styles.hasContent}`;
                } else {
                    className += ` ${styles.empty}`;
                }

                return (
                    <button
                        key={char}
                        onClick={() => onSelectChar(char)}
                        className={className}
                    >
                        {char}
                    </button>
                );
            })}
        </div>
    );
};

export default CharacterGrid;
