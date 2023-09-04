import type { Config } from '../createConfig.js'

// rome-ignore lint/suspicious/noEmptyInterface: For extending global type
export interface Register {}
export type ResolvedRegister = {
  config: Register extends { config: infer config extends Config }
    ? config
    : Config
}