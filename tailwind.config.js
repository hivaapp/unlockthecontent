/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Söhne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                nunito: ['Nunito', 'sans-serif'], // For specific uses like toasts
            },
            colors: {
                bg: '#FAF9F7',
                surface: '#FFFFFF',
                surfaceAlt: '#F3F1EC',
                border: '#E6E2D9',
                text: '#21201C',
                textMid: '#6B6860',
                textLight: '#767676',
                brand: {
                    DEFAULT: '#D97757',
                    hover: '#C4663F',
                    tint: '#FAF0EB'
                },
                success: {
                    DEFAULT: '#417A55',
                    bg: '#EBF5EE',
                },
                warning: {
                    DEFAULT: '#A0622A',
                    bg: '#FDF4EC',
                },
                error: {
                    DEFAULT: '#C0392B',
                    bg: '#FDECEA',
                }
            },
            boxShadow: {
                DEFAULT: '0 1px 3px rgba(0,0,0,0.06)',
            },
            borderRadius: {
                'button': '6px', // "rounded-md" is default tailwind ~6px, but let's leave default or config specific
                'card': '8px',   // "rounded-lg" is 8px
                'badge': '10px',
                'pill': '50px'
            }
        },
    },
    plugins: [],
}
