import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula o tamanho do roteiro baseado na duração do vídeo
 * Fórmula: 160 palavras por minuto × 8 caracteres por palavra (incluindo espaços)
 * Adiciona 10% a mais na duração para cálculo mais preciso
 * @param durationMinutes Duração do vídeo em minutos
 * @returns Objeto com palavras e caracteres calculados
 */
export function calculateScriptSize(durationMinutes: number): { words: number; characters: number } {
  const wordsPerMinute = 160;
  const charactersPerWord = 8; // Incluindo espaços
  
  // Adiciona 10% a mais na duração para cálculo mais preciso
  const adjustedDuration = durationMinutes * 1.1;
  
  const totalWords = adjustedDuration * wordsPerMinute;
  const totalCharacters = totalWords * charactersPerWord;
  
  return {
    words: Math.round(totalWords),
    characters: Math.round(totalCharacters)
  };
}
