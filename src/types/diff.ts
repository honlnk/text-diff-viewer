export interface DiffRecord {
  position: number
  type: 'add' | 'delete' | 'modify'
  content: string
  originalContent?: string
}

export interface DiffResult {
  editDistance: number
  diffs: DiffRecord[]
  similarity: number
  text1: string
  text2: string
}

export interface FileData {
  name?: string
  content: string
  type: 'file' | 'text'
  size?: number
}

export interface ExportOptions {
  includeMetadata: boolean
  includeTimestamp: boolean
  includeStats: boolean
}

export interface DiffStats {
  additions: number
  deletions: number
  modifications: number
  similarity: number
}