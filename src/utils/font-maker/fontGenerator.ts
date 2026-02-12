import opentype from 'opentype.js';
import { Stroke, Point } from '@/types/types';

// Helper to determine character group for auto-scaling
const getCharGroup = (char: string) => {
    const code = char.charCodeAt(0);
    // Tall: A-Z (65-90), 0-9 (48-57), b, d, f, h, k, l, t (include 'i' here for full height)
    const tallChars = new Set(['b', 'd', 'f', 'h', 'i', 'k', 'l', 't']);
    if ((code >= 65 && code <= 90) || (code >= 48 && code <= 57) || tallChars.has(char)) {
        return 'TALL'; // Target 700
    }

    // Short: a, c, e, m, n, o, r, s, u, v, w, x, z
    const shortChars = new Set(['a', 'c', 'e', 'm', 'n', 'o', 'r', 's', 'u', 'v', 'w', 'x', 'z']);
    if (shortChars.has(char)) {
        return 'SHORT'; // Target 500
    }

    // Descender: g, j, p, q, y
    const descenderChars = new Set(['g', 'j', 'p', 'q', 'y']);
    if (descenderChars.has(char)) {
        return 'DESCENDER'; // Target ~700, Top aligned
    }

    return 'DEFAULT';
};

// Helper to download the buffer
const downloadBuffer = (buffer: ArrayBuffer, filename: string) => {
    const blob = new Blob([buffer], { type: 'font/ttf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
};

// Helper: Calculate bounding box of strokes
const getBoundingBox = (strokes: Stroke[]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach(s => {
        s.points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });
    });
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
};

interface GenerateOptions {
    autoScale: boolean;
    familyName?: string;
    styleName?: string;
    author?: string;
    version?: string;
    weightMultiplier?: number;
}

// Generate font and return as data URL for preview
export const generateFontDataURL = async (fontData: Record<string, Stroke[]>, options: GenerateOptions = { autoScale: false }): Promise<string | null> => {
    const buffer = await generateFontBuffer(fontData, options);
    if (!buffer) return null;

    const blob = new Blob([buffer], { type: 'font/ttf' });
    return URL.createObjectURL(blob);
};

// Generate font and download
export const generateFont = async (fontData: Record<string, Stroke[]>, options: GenerateOptions = { autoScale: false }) => {
    const buffer = await generateFontBuffer(fontData, options);
    if (!buffer) return;

    const family = options.familyName?.replace(/\s+/g, '') || 'MyCustomFont';
    const style = options.styleName?.replace(/\s+/g, '') || 'Regular';
    const filename = `${family}-${style}.ttf`;

    downloadBuffer(buffer, filename);
};

// Core font generation logic
const generateFontBuffer = async (fontData: Record<string, Stroke[]>, options: GenerateOptions = { autoScale: false }): Promise<ArrayBuffer | null> => {
    // Access Paper.js from the global scope (loaded via Script tag)
    // ensuring we wait for it to be ready? It should be ready via 'beforeInteractive' or we check window.

    // Safety check for SSR environment where window is undefined (though generateFont is called on client action)
    if (typeof window === 'undefined' || !(window as any).paper) {
        console.error("Paper.js not loaded");
        return null;
    }

    const paper = (window as any).paper;
    console.log('Paper.js loaded:', !!paper);

    // Setup Paper.js on a headless canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    paper.setup(canvas);
    console.log('Paper.js setup complete');

    // Create a NotDef glyph
    const notdefPath = new opentype.Path();
    notdefPath.moveTo(100, 0);
    notdefPath.lineTo(100, 700);
    notdefPath.lineTo(500, 700);
    notdefPath.lineTo(500, 0);
    notdefPath.close();

    const notdefGlyph = new opentype.Glyph({
        name: '.notdef',
        unicode: 0,
        advanceWidth: 600,
        path: notdefPath
    });

    const glyphs = [notdefGlyph];

    // Add a mandatory space glyph for compatibility
    const spaceGlyph = new opentype.Glyph({
        name: 'space',
        unicode: 32,
        advanceWidth: 250,
        path: new opentype.Path()
    });
    glyphs.push(spaceGlyph);

    const CAN_HEIGHT = 600;
    const BASELINE_Y = CAN_HEIGHT * 0.75; // 450
    const TARGET_TALL = 700;
    const TARGET_SHORT = 500;

    Object.keys(fontData).forEach(char => {
        const strokes = fontData[char];
        if (!strokes || strokes.length === 0) return;

        const group = getCharGroup(char);
        const bbox = getBoundingBox(strokes);

        let scale = 1000 / 600;
        let diffX = 0;

        // Auto Scale Logic
        if (options.autoScale) {
            const h = Math.max(bbox.height, 10);
            const w = Math.max(bbox.width, 10);

            // Minimal padding for tight spacing
            const paddingX = 5;

            if (group === 'TALL') {
                scale = TARGET_TALL / h;
            } else if (group === 'SHORT') {
                scale = TARGET_SHORT / h;
            } else if (group === 'DESCENDER') {
                scale = 750 / h;
            } else {
                scale = 600 / h;
                scale = Math.min(scale, (1000 / 600) * 1.5);
            }

            // Cap scale based on Width to avoid explosion
            const maxW = 800;
            if (w * scale > maxW) {
                scale = maxW / w;
            }

            diffX = -bbox.minX * scale + paddingX; // Shift to 0 then add padding

            // Vertical Alignment
            // Simplified Logic:
            // We want bbox.maxY (Bottom) to align to 0 (Baseline) for TALL/SHORT
            // transY = (bbox.maxY - y) * scale
        }

        // Helper to transform point to Font Coordinates
        const transformPoint = (p: { x: number, y: number }) => {
            let tx, ty;
            if (options.autoScale) {
                tx = p.x * scale + diffX;
                // Default alignment: Bottom of bbox -> 0
                // If Descender: Top of bbox -> 500
                if (group === 'DESCENDER') {
                    // y_font = 500 - (p.y - bbox.minY) * scale
                    ty = 500 - (p.y - bbox.minY) * scale;
                } else {
                    // y_font = (bbox.maxY - p.y) * scale
                    ty = (bbox.maxY - p.y) * scale;
                }
            } else {
                // Manual: normalize to start from left edge of bounding box
                const scale = 1000 / 600;
                const paddingX = 5;
                tx = (p.x - bbox.minX) * scale + paddingX; // Shift to 0 then add padding
                ty = (BASELINE_Y - p.y) * scale;
            }
            return new paper.Point(tx, ty);
        };

        // Create Paper Paths
        const paperPaths: any[] = [];

        strokes.forEach(stroke => {
            if (stroke.type === 'eraser') return;
            if (stroke.points.length < 2) return;

            // Use stored width if available, otherwise use defaults
            const baseWidth = stroke.width || (stroke.type === 'normal' ? 8 : 15);

            // Base font weight scale to make it feel more substantial than a hairline
            // 8px on 600px is thin. We multiply slightly to give it some body.
            const baseFontWeightScale = 1.6;

            // Apply weight multiplier (e.g., 2.5 for bold)
            const multiplier = options.weightMultiplier || 1.0;
            const width = baseWidth * scale * baseFontWeightScale * multiplier;
            const isCalligraphy = stroke.type === 'calligraphy';

            // Construct offset path manually (ribbon) as a Paper Path
            // We use the same logic as before but store points in array
            // and build a closed paper.Path

            const pPoints = stroke.points.map(transformPoint);
            const pathSegments: any[] = [];

            // ... Ribbon Logic ...
            const leftSide: any[] = [];
            const rightSide: any[] = [];
            const halfW = width / 2;

            for (let i = 0; i < pPoints.length; i++) {
                const p = pPoints[i];
                let dx = 1, dy = 0;
                if (i < pPoints.length - 1) {
                    dx = pPoints[i + 1].x - p.x;
                    dy = pPoints[i + 1].y - p.y;
                } else if (i > 0) {
                    dx = p.x - pPoints[i - 1].x;
                    dy = p.y - pPoints[i - 1].y;
                }
                const len = Math.hypot(dx, dy);
                if (len < 0.001) continue;

                const nx = -dy / len;
                const ny = dx / len;

                if (isCalligraphy) {
                    const angle = -45 * (Math.PI / 180);
                    const cx = (Math.cos(angle) * width) / 2;
                    const cy = (Math.sin(angle) * width) / 2;
                    leftSide.push(new paper.Point(p.x - cx, p.y - cy));
                    rightSide.push(new paper.Point(p.x + cx, p.y + cy));
                } else {
                    leftSide.push(new paper.Point(p.x + nx * halfW, p.y + ny * halfW));
                    rightSide.push(new paper.Point(p.x - nx * halfW, p.y - ny * halfW));
                }
            }

            // Build closed polygon points
            const polygonPoints = [...leftSide, ...rightSide.reverse()];
            let pPath: any = new paper.Path(polygonPoints);
            pPath.closed = true;

            // CRITICAL: Resolve self-intersections for each individual stroke
            // This is key for characters like "e" drawn in one stroke
            try {
                const resolved = pPath.unite(pPath);
                if (resolved) pPath = resolved;
            } catch (e) {
                console.warn('Self-unite failed for stroke', e);
            }

            paperPaths.push(pPath);
        });

        if (paperPaths.length === 0) return null;

        // Boolean Union with fallback
        let mergedPath: any = null;
        console.log(`Processing ${paperPaths.length} strokes for character`);

        try {
            // Start with the first resolved path
            mergedPath = paperPaths[0];

            // If there's only one stroke, ensure it's "resolved" even more if needed
            // Actually unite(pPath) already did a lot, but let's be robust
            if (paperPaths.length === 1) {
                const finalResolved = mergedPath.unite(mergedPath);
                if (finalResolved) mergedPath = finalResolved;
            }

            for (let i = 1; i < paperPaths.length; i++) {
                const result: any = mergedPath.unite(paperPaths[i]);
                if (result) {
                    mergedPath = result;
                    console.log(`Unite ${i} succeeded`);
                } else {
                    console.warn('Paper.js unite failed, using fallback');
                    mergedPath = null;
                    break;
                }
            }

            // Ensure correct winding for TTF format
            // In TTF, outer paths should be clockwise
            if (mergedPath) {
                // Better approach: reorient ensures outer is clockwise and holes are CCW
                if (typeof mergedPath.reorient === 'function') {
                    mergedPath.reorient(true, true);
                } else {
                    // Fallback to manual check
                    if (mergedPath.clockwise === false) {
                        mergedPath.reverse();
                        console.log('Reversed path to clockwise');
                    }
                }
            }
        } catch (error) {
            console.error('Paper.js boolean operation failed:', error);
            mergedPath = null;
        }

        // CORRECTED Fallback: Handle CompoundPath or Simple Path
        let pathsToConvert: any[] = [];
        if (mergedPath) {
            // Check className to differentiate between Path and CompoundPath
            if (mergedPath.className === 'CompoundPath') {
                pathsToConvert = mergedPath.children || [mergedPath];
            } else {
                pathsToConvert = [mergedPath];
            }
        } else {
            pathsToConvert = paperPaths;
        }

        console.log(`Converting ${pathsToConvert.length} path(s) to OpenType`);

        // Convert Paper Path(s) to OpenType Path
        const path = new opentype.Path();

        pathsToConvert.forEach((item: any) => {
            const sub = item;
            if (!sub.segments || sub.segments.length === 0) return;

            const start = sub.segments[0].point;
            path.moveTo(Math.round(start.x), Math.round(start.y));

            for (let i = 0; i < sub.segments.length; i++) {
                const seg = sub.segments[i];
                const nextSeg = sub.segments[(i + 1) % sub.segments.length];

                const p1 = nextSeg.point;

                // If linear
                if (seg.handleOut.isZero() && nextSeg.handleIn.isZero()) {
                    path.lineTo(Math.round(p1.x), Math.round(p1.y));
                } else {
                    // Cubic Bezier
                    const cp1 = seg.point.add(seg.handleOut);
                    const cp2 = nextSeg.point.add(nextSeg.handleIn);
                    path.bezierCurveTo(
                        Math.round(cp1.x), Math.round(cp1.y),
                        Math.round(cp2.x), Math.round(cp2.y),
                        Math.round(p1.x), Math.round(p1.y)
                    );
                }
            }
            path.close();
        });


        // Determine advance width based on actual drawn content
        const boundsSource = mergedPath || paperPaths[0];
        const bounds = boundsSource ? boundsSource.bounds : null;
        let advWidth = 600;

        if (bounds && bounds.width > 0) {
            advWidth = Math.round(bounds.width + 10); // 5 padding each side
        }

        if (!Number.isFinite(advWidth) || advWidth <= 0) {
            advWidth = 600; // safe fallback
        }


        const glyph = new opentype.Glyph({
            name: char,
            unicode: char.charCodeAt(0),
            advanceWidth: advWidth,
            path: path
        });

        glyphs.push(glyph);
    });

    const font = new opentype.Font({
        familyName: options.familyName || 'MyCustomFont',
        styleName: options.styleName || 'Regular',
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200,
        designer: options.author || 'Font Maker',
        version: options.version || '1.000',
        glyphs: glyphs,
        outlinesFormat: 'truetype'
    } as any);

    return font.toArrayBuffer();
};
