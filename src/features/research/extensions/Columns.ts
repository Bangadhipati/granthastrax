import { Extension } from '@tiptap/core'

export interface ColumnsOptions {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (columns: number) => ReturnType
      unsetColumns: () => ReturnType
    }
  }
}

export const Columns = Extension.create<ColumnsOptions>({
  name: 'columns',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'bulletList', 'orderedList'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          columns: {
            default: null,
            parseHTML: element => element.style.columnCount || null,
            renderHTML: attributes => {
              if (!attributes["columns"]) {
                return {}
              }
              return {
                style: `column-count: ${attributes["columns"]}; column-gap: 2rem;`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setColumns: columns => ({ commands }) => {
        return this.options.types.every(type => commands.updateAttributes(type, { columns }))
      },
      unsetColumns: () => ({ commands }) => {
        return this.options.types.every(type => commands.resetAttributes(type, 'columns'))
      },
    }
  },
})
