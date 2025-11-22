import { defineConfig, presetUno, presetAttributify, presetIcons, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  shortcuts: {
    'btn-primary': 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer',
    'btn-success': 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer',
    'btn-danger': 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded cursor-pointer',
    'card-base': 'bg-white shadow-md rounded-lg p-6',
    'text-diff-delete': 'bg-red-200 text-red-800 px-1 rounded',
    'text-diff-add': 'bg-green-200 text-green-800 px-1 rounded',
    'text-diff-modify': 'bg-blue-200 text-blue-800 px-1 rounded',
  },
})