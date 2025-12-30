import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#b8946f',
                    dark: '#8b6f4d',
                },
                accent: '#c9a875',
                secondary: '#2c3e50',
            },
        },
    },
    plugins: [],
} satisfies Config;
