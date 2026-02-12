import {
    DataStyleConfig,
    DisplayConfig,
    EffectsConfig,
    FontsConfig,
    RoutesConfig,
    SchemaConfig,
    StyleConfig,
} from "@/types";
import { home } from "./content";

const baseURL: string = "https://ericzhong.com";

const routes: RoutesConfig = {
    "/font-maker": true,
    "/": true,
};

const display: DisplayConfig = {
    location: false,
    time: false,
    themeSwitcher: true,
};

import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";

const heading = Geist({
    variable: "--font-heading",
    subsets: ["latin"],
    display: "swap",
});

const body = Geist({
    variable: "--font-body",
    subsets: ["latin"],
    display: "swap",
});

const label = Geist({
    variable: "--font-label",
    subsets: ["latin"],
    display: "swap",
});

const code = Geist_Mono({
    variable: "--font-code",
    subsets: ["latin"],
    display: "swap",
});

const fonts: FontsConfig = {
    heading: heading,
    body: body,
    label: label,
    code: code,
};

const style: StyleConfig = {
    theme: "system",
    neutral: "gray",
    brand: "indigo",
    accent: "indigo",
    solid: "contrast",
    solidStyle: "flat",
    border: "playful",
    surface: "translucent",
    transition: "all",
    scaling: "100",
};

const dataStyle: DataStyleConfig = {
    variant: "flat",
    mode: "categorical",
    height: 24,
    axis: {
        stroke: "var(--neutral-alpha-weak)",
    },
    tick: {
        fill: "var(--neutral-on-background-weak)",
        fontSize: 11,
        line: false,
    },
};

const effects: EffectsConfig = {
    mask: {
        cursor: false,
        x: 0,
        y: 0,
        radius: 0,
    },
    gradient: {
        display: false,
        opacity: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        tilt: 0,
        colorStart: "accent-background-strong",
        colorEnd: "page-background",
    },
    dots: {
        display: false,
        opacity: 0,
        size: "2",
        color: "brand-background-strong",
    },
    grid: {
        display: false,
        opacity: 0,
        color: "neutral-alpha-medium",
        width: "0.25rem",
        height: "0.25rem",
    },
    lines: {
        display: false,
        opacity: 0,
        color: "neutral-alpha-weak",
        size: "16",
        thickness: 1,
        angle: 45,
    },
};

const schema: SchemaConfig = {
    logo: "",
    type: "Person",
    name: "Eric Zhong",
    description: home.description,
    email: "ericzhong@example.com",
};

export {
    display,
    routes,
    baseURL,
    fonts,
    style,
    schema,
    effects,
    dataStyle,
};
